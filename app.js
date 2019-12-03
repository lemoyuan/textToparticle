var targetCanvas, targetCanvasContext;
var uploadedImage = null;

if (window.console === undefined) {
	window.console = {
		log: function (str) {}
	}
}

function turnWordToImage(str) {	
	targetCanvasContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
	targetCanvasContext.fillStyle = 'white';

	var fontface = "helvetica";
	var fontsize = 400;
	var measured;
	var horizontalPadding = 240;

	do {
	    fontsize--;
	    targetCanvasContext.font = fontsize + "px " + fontface;
	    measured = targetCanvasContext.measureText(str);

	} while (fontsize > 0 && measured.width > (targetCanvas.width - horizontalPadding));

	var textHeight = fontsize;
	var yPosition = fontsize/2 + (targetCanvas.height - fontsize/2)/2 + 50;

	var xOff = 0;
	if (measured.width < (targetCanvas.width - horizontalPadding)) {
		xOff = (targetCanvas.width - horizontalPadding - measured.width)/2;
	}

	targetCanvasContext.fillText(str, horizontalPadding/2 + xOff, yPosition);
	// targetCanvasContext.fillText("hello", 20, 20);
}

function useUploadedImage() {
	// var canvas = document.createElement('canvas');
	// canvas.width = 1280;
	// canvas.height = 720;
	// canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
	targetCanvasContext.drawImage(uploadedImage, 0, 0, targetCanvas.width, targetCanvas.height);
}

function useWordOrImage() {
	if (str.value == "") {
		useUploadedImage();
	} else {
		turnWordToImage(str.value);
	}
}

function RGBToID(r, g, b) {
	var id = Math.round(r / 5) + 50 * Math.round(g / 5) + 50 * 50 * Math.round(b / 5);
	return id;
}

function preview(lut_only) {
	// Put object map and shade into canvas so can access pixels
	var objectCanvasContext = object_canvas.getContext('2d');
	var shadeCanvasContext = shade_canvas.getContext('2d');
	var previewCanvasContext = preview_canvas.getContext('2d');

	var scene = document.querySelector('select').value;
	objectCanvasContext.drawImage(window['object_img_' + scene], 0, 0);
	shadeCanvasContext.drawImage(window['shade_img_' + scene], 0, 0);

	// Find pixels below each object
	var textCanvasImageData = targetCanvasContext.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
	var textCanvasPixels = textCanvasImageData.data;
	var objectPixels = objectCanvasContext.getImageData(0, 0, object_canvas.width, object_canvas.height).data;
	var shadePixels = shadeCanvasContext.getImageData(0, 0, shade_canvas.width, shade_canvas.height).data;
	var outImageData = previewCanvasContext.createImageData(targetCanvas.width, targetCanvas.height);
	var outPixels = outImageData.data;

	var objectTotals = {};
	var candyColors = [[204,87,2],[74,204,15],[2,136,255],[236,255,11],[255,48,42]];//, , [2,136,255], [236,255,11], [255,8,2], [74,204,15], [2,136,255], [236,255,11], [255,8,2]];

	for (var y = 0; y < targetCanvas.height; y++) {
		for (var x = 0; x < targetCanvas.width; x++) {
			var index = (x + y*targetCanvas.width )*4;
			var id = RGBToID(objectPixels[index], objectPixels[index + 1], objectPixels[index + 2]);

			var r = textCanvasPixels[index];
			var g = textCanvasPixels[index + 1];
			var b = textCanvasPixels[index + 2];
			var a = textCanvasPixels[index + 3];

			var randomCandyColor = candyColors[Math.floor(Math.random() * candyColors.length)]

			if (objectTotals[id] === undefined) {
				objectTotals[id] = {
					r: randomCandyColor[0]*randomCandyColor[0],
					g: randomCandyColor[1]*randomCandyColor[1],
					b: randomCandyColor[2]*randomCandyColor[2],
					count: 1
				};
			}

			objectTotals[id].count += (a/255);
			objectTotals[id].r += r*r*(a/255);
			objectTotals[id].g += g*g*(a/255);
			objectTotals[id].b += b*b*(a/255);
		}
	}

	// Create LUT where each object is assigned the average color under it, or default to random candy color.
	var lut = [];
	for (var i = 0; i < 50000; i++) {
		var randomCandyColor = candyColors[Math.floor(Math.random() * candyColors.length)]
		if (objectTotals[i] === undefined) {
			lut[i] = randomCandyColor;
		} else {
			lut[i] = [
				Math.sqrt(objectTotals[i].r / objectTotals[i].count),
				Math.sqrt(objectTotals[i].g / objectTotals[i].count),
				Math.sqrt(objectTotals[i].b / objectTotals[i].count)
			];
		}

		// if (lut[i][0] == 255) {
		// 	lut[i] = randomCandyColor;
		// }
	}
	lut[0] = [255,255,255];

	if (lut_only) {
		return lut;
	}

	// Use LUT, object map and shade to create preview
	for (var y = 0; y < targetCanvas.height; y++) {
		for (var x = 0; x < targetCanvas.width; x++) {
			var index = (x + y*targetCanvas.width )*4;
			var id = RGBToID(objectPixels[index], objectPixels[index + 1], objectPixels[index + 2]);
			var shade = shadePixels[index] / 255.;
			outPixels[index] = lut[id][0] * shade;
			outPixels[index + 1] = lut[id][1] * shade;
			outPixels[index + 2] = lut[id][2] * shade;
			outPixels[index + 3] = 255;
		}
	}

	previewCanvasContext.putImageData(outImageData, 0, 0);
	preview_img.style.display = 'none';
	preview_canvas.style.display = 'block';
	document.querySelector('.preview').style.display = 'block';
}

function randomAdjectivize() {
	var adjectives = ["dead","hairless","sadistic","metal","wild","domesticated","abnormal","medicated","cocky","massive","disrespectful","impressive","out of control","internet worthy","hilarious","sexy","hot","very tactful","bearded","duck-like","violent","slimy","insanely creepy","embarrassed to the bone","self-centered","talking","naked","angry","shaky","deep","sick","zippy","sticky","fluffy","frozen","unholy","painfully honest","filthy","fighting","bonkers","harsh","frisky","greedy","crawly","insane","hideous","ungodly","abusive","drunken","hateful","idiotic","twisted","useless","yapping","magical","indecent","godawful","arrogant","confused","flirting","high-end","insecure","maniacal","sickened","slippery","stubborn","tripping","vengeful","sinister","costumed","cowardly","haunting","startled","alcoholic","demanding","shivering","offensive","nighttime","startling","disgusting","slap happy","disturbing","adulterous","blathering","flickering","rebellious","impertinent","bull headed","hyperactive","infuriating","outnumbered","pea-brained","territorial","underhanded","zombie like","mischievous","at-the-ready","free-loading","house-broken","up-to-no-good","cruel-hearted","misunderstood","narrow-minded","self-absorbed","bat-shit-crazy","fiercely-loyal","out-of-control","fear-inspiring","bat shit crazy","mentally impaired"];
	var putRandomAdjectivesHere = document.querySelectorAll(".randomAdjective");
	for (var i = 0; i < putRandomAdjectivesHere.length; i++) {
		var here = putRandomAdjectivesHere[i];
		here.innerText = adjectives[Math.floor(Math.random() * adjectives.length)];
	}
}

function chooseRandomAnimal() {
	var unicode = ["🐵", "🐹", "🐰", "🐭", "🐺", "🐶", "🦊", "🐯", "🦁", "🐷", "🐮", "🐸", "🦄", "🐈", 
	"🐨", "🦖", "🐍", "🦜", "🐳", "🐙", "🐤", "🐢", "👻", "🤡", "🤖", "🧔", "👵", "👴", "🤪", "😒", "😍","🥴", "🧟", "🦑", "🦠", "🦢"];
	var animalName = ["monkeys", "hamsters", "bunnies", "mice", "wolves", "doges", "foxes", "tigers", "lions", "pigs", "cows", "frogs", "unicorns", "cats",
	"koalas", "dinosaurs", "snakes", "parrots", "whales", "octopi", "baby chicks", "turtles", "ghosts", "clowns", "robots", "bearded men", "old women", "old men", "crazy people", "unamused people", "lovers", "drunk guys", "zombies", "squid", "microbes", "swans"];
	var j = Math.floor(Math.random() * animalName.length);
	return {
		"unicode": unicode[j],
		"animalName": animalName[j]
	};
}

function replaceAnimalPlaceholders(chosenAnimal) {
	var animalUnicodeHere = document.querySelectorAll(".animalUnicode");
	for (var i = 0; i < animalUnicodeHere.length; i++) {
		var here = animalUnicodeHere[i];
		here.innerText = chosenAnimal.unicode;
	}

	var animalNameHere = document.querySelectorAll(".animalName");
	for (var i = 0; i < animalNameHere.length; i++) {
		var here = animalNameHere[i];
		here.innerText = chosenAnimal.animalName;
	}
}

function replaceOneOfs() {
	var oneOfs = document.querySelectorAll(".oneOf");
	for (var i = 0; i < oneOfs.length; i++) {
		var options = oneOfs[i].innerText.split('|');
		var randomOptionI = Math.floor(Math.random() * options.length);
		oneOfs[i].innerText = options[randomOptionI];
	}
}

var renderStartedTime = null;
function startRender(lut) {

    updateProgressMessage("Preparing...");
    updateProgressPercentage(0);
	var url = 'ws://localhost:8880/ws';
	if (document.location.href.indexOf("customanim") !== -1) {
		url = 'wss://customanim.com:8810/ws';
	}
	if (document.location.href.indexOf("hattemi") !== -1) {
		url = 'wss://hattemi.com:8810/ws';
	}

	var ws = new WebSocket(url);
	renderStartedTime = new Date().getTime();

	ws.onopen = function () {
	    console.log("websocket open");
	    updateProgressMessage("Encoding your text...");
		target_canvas.toBlob(function (blob) {
			updateProgressMessage("Sending target image to GPU server...");
			var jobDescription = {
				scene: document.querySelector('select').value,
				lut: lut
			};
			ws.send(JSON.stringify(jobDescription));
			ws.send(blob);
		});
	};

	ws.onclose = function () {
		updateProgressMessage("Lost connection to server, please try again in a bit.");
	    console.log("onclose");
	};

	ws.onmessage = function (msg) {
		if (typeof msg.data === "string") {
			console.log("Got text message: " + msg.data);
			updateProgressBar();

			if (msg.data.startsWith('job complete: ')) {
				updateProgressMessage("Render complete.");
				document.querySelector('.progress_container').style.display = 'none';

				var key = msg.data.replace('job complete: ', '');
				var url = 'http://localhost:8880/completed_job/' + key + '.mp4';
				if (document.location.href.indexOf("customanim") !== -1) {
					url = 'https://customanim.com:8810/completed_job/' + key + '.mp4';
				}
				if (document.location.href.indexOf("hattemi") !== -1) {
					url = 'https://hattemi.com:8810/completed_job/' + key + '.mp4';
				}
				console.log(url);
				result.style.display = 'block';
				video.src = url;
				download_link.href = url;

//				document.querySelector('h2').innerText = 'Make another one?';
				render_button.classList.remove("inactive");
			}

			if (msg.data.startsWith('progress: ')) {
				var progressMessage = msg.data.replace('progress: ', '');
				updateProgressMessage(progressMessage);
			}

			if (msg.data === 'job failed') {
				updateProgressPercentage(100);
				updateProgressMessage("Render failed");
				render_button.classList.remove('inactive');
			}
		} 
		// if (msg.data instanceof Blob) {
		// 	var blob = msg.data;
		// 	console.log("Got blob");
		// }
	}

	// ws.send(str);
}

var progress = 0;
function updateProgressBar() {
	if (render_button.classList.contains('inactive')) {
		var progress = Math.atan((new Date().getTime() - renderStartedTime) / 4000)/(Math.PI/2) * 100;
		updateProgressPercentage(progress);
		requestAnimationFrame(updateProgressBar);
	}
}
function updateProgressMessage(message) {
	progress_message.innerText = message;
}
function updateProgressPercentage(percentDone) {
	inner_progress.style.width = percentDone + '%';
}

var imageRepresentsWhatWord = null;

function previewClicked() {
	// Turn the entered word into an image
	useWordOrImage();
//	turnWordToImage(str.value);
	imageRepresentsWhatWord = str.value;

	preview(false);
	preview_button.classList.remove("inactive");
}

window.onload = function () {
	document.querySelector('select').addEventListener('change', function () { 
		select(document.querySelector('select').value);
	});
	umbrella_select.addEventListener('click', function () { select('umbrella'); });
	candy_select.addEventListener('click', function () { select('candy'); });
	select('candy');

	render_button.classList.remove('inactive');
	preview_button.classList.remove('inactive');
	document.querySelector('.progress_container').style.display = "none";
	str.setSelectionRange(0, str.value.length);

	targetCanvas = target_canvas;
	targetCanvasContext = targetCanvas.getContext("2d");

	var chosenAnimal = chooseRandomAnimal();
	replaceAnimalPlaceholders(chosenAnimal);
	randomAdjectivize();
	replaceOneOfs();
	spice.style.display = 'block';

	str.addEventListener('keyup', function (evt) {
		// Turn the entered word into an image
		// turnWordToImage(str.value);

		// preview();
	});

	preview_button.addEventListener('click', function (evt) {

		preview_button.classList.add("inactive");
		setTimeout(previewClicked, 30);

		// Send image to queue server
		// Tell user their queue position
		// 

		// alert('spice');
		evt.preventDefault();
		evt.stopPropagation();
	});

	render_button.addEventListener('click', function (evt) {
		render();
	});

	function render() {
		// Just so I'll know which animations I should pre-render beforehand
		if (window.gtag) {
			gtag('event', str.value != "" ? str.value : "image", {
				'event_category': 'render'
			});
		}

		document.querySelector('.preview').style.display = 'none';

		var scene = document.querySelector('select').value;
		if (str.value === "HELLO") {
			result.style.display = 'block';
			if (scene === "candy") {
				url = "hello.mp4";
			} else {
				url = "hello_" + scene + ".mp4";
			}
                        video.src = url;
                        download_link.href = url;
			return;
		}

		render_button.classList.add("inactive");
		document.querySelector('.progress_container').style.display = 'table';

		useWordOrImage();
		// if (str.value !== imageRepresentsWhatWord) {
			// turnWordToImage(str.value);
			// imageRepresentsWhatWord = str.value;
		// }
		var lut = preview(true);
		startRender(lut);
	}

	upload_picture.addEventListener('change', function (evt) { 
		upload_picture.classList.add("inactive");
		console.log("Change");
		var file = evt.target.files[0];
		var reader = new FileReader();
        reader.onload = function (readerEvent) {
        	console.log("Reader online");
	        var image = new Image();
            image.onload = function (imageEvent) {
            	console.log("Image onload");
            	console.log("Image " + image.width + " x " + image.height + " was loaded");
            	uploadedImage = image;
	            upload_picture.classList.remove("inactive");
	            // button_under_upload_picture.innerText = 'Change Image';
	            str.value = "";
	            previewClicked();
            }
            image.src = readerEvent.target.result;
		}
		reader.readAsDataURL(file);
	});

	// turnWordToImage(str.value);
	// preview();
	//render();
}

function select(scene) {
	for (var c of document.querySelectorAll('.widget video.selected')) { c.classList.remove('selected'); }
	window['' + scene + '_select'].classList.add('selected');
	document.querySelector('select').value = scene;
}


