const { PDFDocument } = PDFLib;
const sizelimit = 10000000;
pdfwidth = 596,
pdfheight = 782;
const types = ["image/png", "image/jpeg", "image/gif", "application/pdf"];
var files = [];

const processfile = (event) => {
        // Process file added to the form field
    for (file of event.target.files) {
        if (file.size < sizelimit) {
            console.log(file.size + " is smaller than " + sizelimit);
            if (types.includes(file.type)) {
                console.log("contains legit type");
                files.push(file);
                files[files.length-1].url = (URL.createObjectURL(file));
                console.log(files);
            } else {
                alert("contains bogus file type");
                console.log(file);
            }
        } else {
            console.log(file.size + " is larger than " + sizelimit);
            alert("Sorry, that's too big! The allowed file size is " + sizelimit)
        }
        populate()
    }
}

const populate = () => {
        // Make list of files for user to see and interact with
    list = document.getElementById("status");
    list.innerHTML = "";
    for ([index, file] of files.entries()) {
        hr = document.createElement("hr");
        icon = document.createElement("img");
        icon.src = typify(file.type) + ".png";
        icon.className = "icon";
        close = document.createElement("a")
        close.className = "close"
        close.onclick = function() {
            files.splice(index-1, 1);
            populate();
        }
        close.innerHTML = "X";
        text = document.createTextNode(file.name)
        list.appendChild(icon);
        list.appendChild(text);
        list.appendChild(close);
        list.appendChild(hr);
    }
}
const typify = (type) => {
        // Get file type
    let ty = type.substr(type.indexOf("/")+1)
    let pe = (ty=="jpeg") ? "jpg" : ty;
    return(tpe = pe.charAt(0).toUpperCase() + pe.slice(1));
}
const imagestats = (item, pdfpage) => {
        // return object with info about item's placement in PDF
    let img = {};
    var wr = (item.width > pdfwidth) ? item.width/pdfwidth : 1;
    var hr = (item.width > pdfheight) ? item.width/pdfheight : 1;
    if (hr+wr == 2) {
        img.width = item.width;
        img.height = item.height;
        img.x = pdfpage.getWidth() / 2 - img.width / 2 + 50;
        img.y = pdfpage.getHeight() / 2 - img.height / 2 + 50;
    } else {
        img.x = img.y = 0;
        console.log(wr + "<" + hr)
        if (wr > hr) {
            console.log("wr");
            img.width = item.width/wr;
            console.log(img.width);
            console.log(pdfpage.getWidth());
            img.height = item.height/wr;
        } else {
            console.log("hr");
            img.width = item.width/hr;
            img.height = item.height/hr;
            console.log(img.height);
        }
    }
    return(img);
}

const createPdf = async (context = 'display') => {
        // Create PDF by looping through files 
    pdfDoc = await PDFDocument.create();
    for (file of files) {
        bytes = await fetch(file.url).then((res) => res.arrayBuffer());
        tipe = typify(file.type);
        if (tipe == "Pdf") {
            fullpdf = await PDFDocument.load(bytes, {ignoreEncryption: true})
            for(count = 0; count < fullpdf.getPages().length; count++) {
                let page = pdfDoc.addPage();
                thepdf = await pdfDoc.embedPage(fullpdf.getPages()[count]);
                page.drawPage(thepdf, {
                    width: page.getWidth(),
                    height: page.getHeight()
                });
            }
        } else {
            let page = pdfDoc.addPage();
            let image = await pdfDoc["embed" + tipe](bytes);
            let img = imagestats(image, page);
            page.drawImage(image, {
                x: img.x,
                y: img.y,
                width: img.width,
                height: img.height,
            })
            page.moveTo(55, 100);
        }
    }
    if (context == "save") {
        const pdfBytes = await pdfDoc.save();
        download(pdfBytes, "pdf-lib_pdf_page_embedding_example.pdf", "application/pdf");
    } else {
        const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
        document.getElementById('pdf').src = pdfDataUri;
    }
}
