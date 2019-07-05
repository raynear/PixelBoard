const ImageJS = require("imagejs");
const IconService = require('icon-sdk-js');
const { HttpProvider, IconBuilder } = require('icon-sdk-js');

const provider = new HttpProvider('https://bicon.net.solidwallet.io/api/v3');
const iconService = new IconService(provider);

const { CallBuilder } = IconBuilder;

const ContractAddress = "cx7588f0968ac458ed765fdb2a0f21c69820e61467";

const ProjectDir = '/home/raynear/icon_project';
const ImgDir = ProjectDir + '/static/';

const express = require('express');
const app = express()

var images = require('images');

var PixelCnt = 32;
var ImgSize = 160;

var HCnt = 10;
var VCnt = 10;

function BuildTotalImg() {
    var myimg = images(ImgSize * HCnt, ImgSize * VCnt);

    for (var i = 0; i < 10; i++) {
        for (var j = 0; j < 10; j++) {
            var ImgCnt = i * 10 + j;
            aImg = images(ImgDir + "/img (" + ImgCnt + ").png");
            aImg = aImg.resize(ImgSize, ImgSize);
            myimg.draw(aImg, j * ImgSize, i * ImgSize);
            aImg = null;
        }
    }

    myimg.save(ImgDir + "/output.png");
}

async function BuildNewImg(index) {
    const callBuilder = new CallBuilder();
    const call = callBuilder
        .to(ContractAddress)
        .method("get_pixels")
        .params({ "index": index })
        .build();

    const pixels = await iconService.call(call).execute();

    const pixelArray = Array();
    for (var i = 0; i < 1024; i++) {
        var aPixel = pixels.pixels.substring(i * 6, i * 6 + 6);
        pixelArray.push(aPixel);
    }

    var bitmap = new ImageJS.Bitmap({ width: ImgSize, height: ImgSize });
    for (var i = 0; i < PixelCnt; i++) {
        for (var j = 0; j < PixelCnt; j++) {
            var x = i * ImgSize / PixelCnt;
            var y = j * ImgSize / PixelCnt;
            var aPixel = pixelArray[i * PixelCnt + j];
            var R = parseInt(aPixel.substring(0, 2), 16);
            var G = parseInt(aPixel.substring(2, 4), 16);
            var B = parseInt(aPixel.substring(4, 6), 16);
            var A = 255;
            for (var k = 0; k < ImgSize / PixelCnt; k++) {
                for (var l = 0; l < ImgSize / PixelCnt; l++) {
                    bitmap.setPixel(x + k, y + l, R, G, B, A);
                }
            }
        }
    }
    result = await bitmap.writeFile(ImgDir + "/img (" + index + ").png");

    return result;
}

function MergeImg(index) {
    var myimg = images(ImgDir + "/output.png");

    aImg = images(ImgDir + "/img (" + index + ").png");
    aImg = aImg.resize(ImgSize, ImgSize);
    j = parseInt(index / HCnt);
    i = index % HCnt;
    myimg.draw(aImg, i * ImgSize, j * ImgSize);

    myimg.save(ImgDir + "/output.png");
}


console.log("app running");

app.use(express.static(ProjectDir));

app.get('/remakeimg', async function(req, res) {
    if (req.query.id) {
        console.log("RemakeImg", req.query.id);
        result = await BuildNewImg(req.query.id);
        setTimeout(function() {
            MergeImg(req.query.id);
        }, 1000);
        res.json({ 'success': 1, 'result': "Remake " + req.query.id });
    } else {
        res.json({ 'success': 0, 'result': 'RemakeImg need "id" query(../RemakeImg?id=1)' });
    }
});


app.get('/RemakeAllImg', function(req, res) {
    BuildTotalImg();
    res.json({ 'success': 1, 'result': 'RemakeAll' });
});

app.get('/mergeimg', function(req, res) {
    if (req.query.id) {
        console.log("mergeimg", req.query.id);
        MergeImg(req.query.id);
        res.json({ 'success': 1, 'result': "merge " + req.query.id });
    } else {
        res.json({ 'success': 0, 'result': 'mergeimg need "id" query(../mergeimg?id=1)' });
    }
});

app.listen(8080);