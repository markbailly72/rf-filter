const PI = Math.PI;
const SOL = 3e8; //speed of light
const PRECISION = 4;
const PERM0 = 8.85418782e-12;
var rfhFilter = {
	'wArray':[],
	'zeArray':[],
	'zoArray':[],
	'zezoArray':[],
	'ceArray':[],
	'coArray':[],
	'plotSVGWidth' : 960,
  	'plotSVGHeight' : 700,
  	'units': 'mm',
  	'inductorD': 'l 30 0 c0 -10,10 -10, 10 0 c0 -10,10 -10, 10 0 c0 -10,10 -10, 10 0 c0 -10,10 -10, 10 0 l 30 0',
  	'capacitorD' : 'l 45 0 m 0 -10 l 0 20 m 10 -20 l 0 20 m 0 -10 l 45 0',
  	'groundD' : 'l 0 10 m -10 0 l 20 0 m -16 5 l 12 0 m -8 5 l 4 0'
};
var app = require('electron').remote;
var dialog = app.dialog;
//var fs = require('fs');
jQuery(function() {
	d3.select('#rfhCalcZButton').on('click',function () { calcZeZo() });
	d3.select('#pclSynthButton').on('click',function () { synthPCLfilter() });
	d3.select('#idSynthButton').on('click',function () { synthIDfilter() });
	d3.select('#plotTypeSelect').on('change',function () {plotData()});
	d3.select('#leCalcButton').on('click',function () {calcLEfilter()});
	d3.select('#silpSynthButton').on('click',function () { synthStepZfilter() });
	d3.select('#leSectionsButton').on('click',function () {
		let il = parseFloat(d3.select('#minILLEText').property('value'));
		let Ac = parseFloat(d3.select('#rippleLEText').property('value'));
		let f1 = parseFloat(d3.select('#f1LEText').property('value'));
		let f3 = parseFloat(d3.select('#f3LEText').property('value'));
		let responseType = d3.select('#leResponseTypeSelect').property('value');
		let n = Math.ceil(calcNumberSections(responseType,f1,f3,Ac,il));
		d3.select('#leResultsDiv').html('Number of Sections Required: '+n);
	});
	//synthIDfilter();
/*	let caps = cEvenOdd(50,3.66,0.254,0.508,0.125);
	let ce = caps[0]*1e12;
	let co = caps[1]*1e12;
	console.log(ce);
	console.log(co);
	console.log(microstripCap(3.66,0.254,0.508));
	console.log(PERM0*3.66*0.508/0.254);*/
	//let test = idFilterC(10.2,0.1,1.27,1.33,0,.02,1.0316,1.1474,0);
	//console.log(...test);
	//console.log(...butterworthTables(4));
	//displaySchematic(5,'bs','pi');
});
function calcZeZo() {
	let wArray=[],zeArray=[],zoArray=[];
	rfhFilter.zeArray = [];
	rfhFilter.zoArray = [];
	rfhFilter.wArray = [];
	rfhFilter.zezoArray = [];
	rfhFilter.ceArray = [];
	rfhFilter.coArray = [];
	let z0 = parseFloat(d3.select('#z0Text').property('value'));
	let er = parseFloat(d3.select('#erText').property('value'));
	let h = parseFloat(d3.select('#heightText').property('value'));
	let s = parseFloat(d3.select('#spacingText').property('value'));
	let t = parseFloat(d3.select('#thicknessText').property('value'));
	let maxW = parseFloat(d3.select('#maxWidthText').property('value')) < h*10 ? parseFloat(d3.select('#maxWidthText').property('value')) : h*10;
	let text ="";
	for (let w=0.125;w < maxW;w=w+0.025) {
		let zeff,eeff1,eree,ereo,z1,ze1,zo1,k,ce,co,c1;
		zeff = singleMicrostrip(z0,er,h,w)[0];
		eeff1 = permittivityEvenOdd(er,h,w,s);
		eree = eeff1[0];
		ereo = eeff1[1];
		z1 = zEvenOdd(zeff,er,eree,ereo,h,w,s);
		ze1 = z1[0].toFixed(1);
		zo1 = z1[1].toFixed(1);
		k = Math.sqrt(z1[2]).toFixed(3);
		c1 = cEvenOdd(z0,er,h,w,s);
		ce = parseFloat(c1[0]*1e12).toFixed(3);
		co = parseFloat(c1[1]*1e12).toFixed(3);
		console.log(w);
		console.log(k);
		rfhFilter.zeArray.push(ze1);
		rfhFilter.zoArray.push(zo1);
		rfhFilter.wArray.push(w);
		rfhFilter.zezoArray.push(k);
		rfhFilter.ceArray.push(ce);
		rfhFilter.coArray.push(co);
		text = text+w.toFixed(3)+","+ze1+","+zo1+","+ce+","+co+"</br>";
	}
	d3.select('#filterResults').html(text);
	//userConsole('normal',text);
	//userConsole('normal','Calculation is complete.');
	plotData();
}
function synthPCLfilter() {
	let z0 = parseFloat(d3.select('#z0Text').property('value'));
	let er = parseFloat(d3.select('#erText').property('value'));
	let h = parseFloat(d3.select('#heightText').property('value'));
	let s = parseFloat(d3.select('#spacingText').property('value'));
	let t = parseFloat(d3.select('#thicknessText').property('value'));
	let maxW = parseFloat(d3.select('#maxWidthText').property('value')) < h*10 ? parseFloat(d3.select('#maxWidthText').property('value')) : h*10;
	let Ac = parseFloat(d3.select('#rippleText').property('value'));
	let n = parseInt(d3.select('#nSectionsText').property('value'));
	let fc = parseFloat(d3.select('#fCenterText').property('value'));
	let bw = parseFloat(d3.select('#bwText').property('value'));
	let acc = parseFloat(d3.select('#pclAccText').property('value'));
	let fu = fc+bw/2;
	let fl = fc-bw/2;
	let zeArray = [];
	let zoArray = [];
	let tol = 0.010;
	let count = 1000;
	//console.log(count);
	let minS = 0.125;
	//let acc = 0.01;
	let k = (n-1)/2;
	let gArray = chebyshevTables(n,Ac);
	zeArray.push(pclFilterZ(fu,fl,z0,1.000,gArray[0],0)[0]); //get ze for g0*g1
	zoArray.push(pclFilterZ(fu,fl,z0,1.000,gArray[0],0)[1]); //get zo for g0*g1

	//console.log(...zoArray);
	if (isOdd(n)) {
		for (let i=0;i <= k;i++) {
			//console.log(gArray[i]);
			zeArray.push(pclFilterZ(fu,fl,z0,gArray[i],gArray[i+1],1)[0]);
			zoArray.push(pclFilterZ(fu,fl,z0,gArray[i],gArray[i+1],1)[1]);
		}
	}
	console.log(...zeArray);
	console.log(...zoArray);
	//var synthResults = new Object;
	var synthArray1 = [];
	var synthArray2 = [];
	var sl = s;
	var su = s;
	var endS = 0;
	let output = "";
	for (let j=0;j<=k;j++) {
		for (let i=0;i < count; i++) {
			s = isOdd(i) ? su : sl;
			synthArray1 = pclFilterW(er,z0,h,s,zeArray[j],zoArray[j],acc);
			if (synthArray1[0] != 0) {
				i = count*2;
				endS = s;
				synthArray2.push(synthArray1[0]);
				synthArray2.push(s);
			}
			else {
				if (isOdd(i)) {su = su+tol;}
				else {
					sl=sl-tol;
					sl = sl<=minS ? minS : sl;
				}
				synthArray1.length = 0;
			}
		}
	}
	if (synthArray1.length == 0) {
		output = "No solution.";
	}
	//var synthArray1 = pclFilterW(er,z0,h,s,zeArray[0],zoArray[0]);
	for (let i=0;i<synthArray2.length;i=i+2) {
		output = output+"Section : Width = "+synthArray2[i].toFixed(2)+", Spacing = "+synthArray2[i+1].toFixed(2)+"</br>";
	}
	console.log(...synthArray2);
	d3.select('#filterResults').html(output);
	/*let gk1 = [];
	gk1.push(1.147);
	gk1.push(1.371);
	gk1.push(1.975);
	gk1.push(1.371);
	gk1.push(1.147);
	console.log(...steppedFilter(50,10000,2.2,0.127,gk1,0.102,1.524));*/
	//console.log(endS);
	//console.log(...zeArray);
	//console.log(...zoArray);
	//console.log(...gArray);
}
function synthIDfilter() {
	var output = "";
	let yArray = [];
	let ceArray = [];
	let coArray = [];
	let wArray = [];
	let spacing = [];
	let erArray = [];
	let z0 = parseFloat(d3.select('#z0Text').property('value'));
	let y0 = 1/z0;
	let er = parseFloat(d3.select('#erText').property('value'));
	let h = parseFloat(d3.select('#heightText').property('value'));
	let s = parseFloat(d3.select('#spacingText').property('value'));
	let t = parseFloat(d3.select('#thicknessText').property('value'));
	let maxW = parseFloat(d3.select('#maxWidthText').property('value')) < h*10 ? parseFloat(d3.select('#maxWidthText').property('value')) : h*10;
	let Ac = parseFloat(d3.select('#rippleText').property('value'));
	let n = parseInt(d3.select('#nSectionsText').property('value'));
	let fc = parseFloat(d3.select('#fCenterText').property('value'));
	let bw = parseFloat(d3.select('#bwText').property('value'));
	let acc = parseFloat(d3.select('#pclAccText').property('value'));
	let fu = fc+bw/2;
	let fl = fc-bw/2;
	let lamda0 = SOL/fc;
	fc = Math.sqrt(fu*fl);
	let zeArray = [];
	let zoArray = [];
	let tol = 0.010;
	let count = 1000;
	let fbw = parseFloat(bw/fc);
	//console.log(count);
	let minS = 0.125;
	//let acc = 0.01;
	let k = (n+1)/2;
	let gArray = chebyshevTables(n,Ac);
	console.log(...gArray);
	console.log(fbw);
	let theta = Math.PI/2*(1-fbw/2);
	console.log(theta);
	let Y1 = 1/(z0*(1-Math.pow(Math.cos(theta),2)/(gArray[0]*gArray[1])));
	let z1 = 1/Y1;
	let J12 = Y1/(Math.tan(theta)*Math.sqrt(gArray[0]*gArray[1]));
	let Y12 = J12*Math.sin(theta);
	console.log(z1);
	let Y = Y1/Math.tan(theta);
	let theta_t = Math.asin(Math.sqrt(Y*Math.pow(Math.sin(theta),2)/(y0*1*gArray[0])))/(1-fbw/2);
	console.log(theta_t);
	let w = calculateW(er,h,z1,0.01);

	console.log(w);
	yArray.push(Y1);
	for (let i=1;i<k;i++) {
		let J = Y1/(Math.tan(theta)*Math.sqrt(gArray[i-1]*gArray[i]));
		yArray.push(J*Math.sin(theta));
	}
	console.log(...yArray);
	zeArray.push(1/(Y1-Y12));
	zoArray.push(1/(Y1+Y12));
	for(let i=2;i<k;i++) {
		zeArray.push(1/(2*Y1-1/zeArray[i-2]-yArray[i]-yArray[i-1]));
		zoArray.push(1/(2*yArray[i]+1/zeArray[i-1]));
	}
	console.log(...zeArray);
	console.log(...zoArray);
	//w = 1.7775;
	for(let i=0;i<zeArray.length;i++) {
		spacing.push(findSgivenW(er,z0,h,w,zeArray[i],zoArray[i],acc));
	}
	erArray = permittivityEvenOdd(er,h,w,spacing[0][0]);
	let quarterWave = lamda0*Math.pow(Math.sqrt(erArray[0]*erArray[1]),-0.5)/4000;
	//spacing.push(findSgivenW(er,z0,h,w,parseFloat(zeArray[0]).toFixed(2),parseFloat(zoArray[0]).toFixed(2),acc));
	output = "Z1 = "+z1.toFixed(2)+"</br> Tap Point = "+(theta_t*180/Math.PI).toFixed(2)+" degrees </br> Width = "+w.toFixed(2)+"</br> Quarter-wave = "+quarterWave+" </br>";
	for (let i=0;i<spacing.length;i++) {
		output = output+"Spacing = "+parseFloat(spacing[i][0]).toFixed(2)+", Zeven = "+parseFloat(spacing[i][1]).toFixed(2)+", Zodd = "+parseFloat(spacing[i][2]).toFixed(2)+"</br>";
	}

	console.log(...spacing);
	//console.log(...synthArray2);
	d3.select('#filterResults').html(output);
	//console.log(...spacing);
	//let erArray = [];
	//w = 2.39;
	//s = 0.13;
	//h = 1.27;
	//er = 6.15;
	//erArray = permittivityEvenOdd(er,h,w,s);
	//let z0eff = singleMicrostrip(z0,er,h,w)[0];
	//let zArray = [];
	//zArray = zEvenOdd(z0eff,er,erArray[0],erArray[1],h,w,s);
	//console.log(...zArray);
	//zeArray.push(pclFilterZ(fu,fl,z0,1.000,gArray[0],0)[0]); //get ze for g0*g1
	//zoArray.push(pclFilterZ(fu,fl,z0,1.000,gArray[0],0)[1]); //get zo for g0*g1

	//console.log(...zoArray);
/*	if (isOdd(n)) {
		for (let i=0;i <= k;i++) {
			//console.log(gArray[i]);
			zeArray.push(pclFilterZ(fu,fl,z0,gArray[i],gArray[i+1],1)[0]);
			zoArray.push(pclFilterZ(fu,fl,z0,gArray[i],gArray[i+1],1)[1]);
		}
	}
	console.log(...zeArray);
	console.log(...zoArray);
	//var synthResults = new Object;
	var synthArray1 = [];
	var synthArray2 = [];
	var sl = s;
	var su = s;
	var endS = 0;
	let output = "";
	for (let j=0;j<=k;j++) {
		for (let i=0;i < count; i++) {
			s = isOdd(i) ? su : sl;
			synthArray1 = pclFilterW(er,z0,h,s,zeArray[j],zoArray[j],acc);
			if (synthArray1[0] != 0) {
				i = count*2;
				endS = s;
				synthArray2.push(synthArray1[0]);
				synthArray2.push(s);
			}
			else {
				if (isOdd(i)) {su = su+tol;}
				else {
					sl=sl-tol;
					sl = sl<=minS ? minS : sl;
				}
				synthArray1.length = 0;
			}
		}
	}
	if (synthArray1.length == 0) {
		output = "No solution.";
	}
	//var synthArray1 = pclFilterW(er,z0,h,s,zeArray[0],zoArray[0]);
	for (let i=0;i<synthArray2.length;i=i+2) {
		output = output+"Section : Width = "+synthArray2[i].toFixed(2)+", Spacing = "+synthArray2[i+1].toFixed(2)+"</br>";
	}
	console.log(...synthArray2);
	d3.select('#filterResults').html(output);*/
	/*let gk1 = [];
	gk1.push(1.147);
	gk1.push(1.371);
	gk1.push(1.975);
	gk1.push(1.371);
	gk1.push(1.147);
	console.log(...steppedFilter(50,10000,2.2,0.127,gk1,0.102,1.524));*/
	//console.log(endS);
	//console.log(...zeArray);
	//console.log(...zoArray);
	//console.log(...gArray);
}
function synthStepZfilter() {
	let z0 = parseFloat(d3.select('#z0Text').property('value'));
	let er = parseFloat(d3.select('#erText').property('value'));
	let h = parseFloat(d3.select('#heightText').property('value'));
	let s = parseFloat(d3.select('#spacingText').property('value'));
	let t = parseFloat(d3.select('#thicknessText').property('value'));
	let maxW = parseFloat(d3.select('#maxWidthText2').property('value'));
	let minW = parseFloat(d3.select('#minWidthText2').property('value'));
	let Ac = parseFloat(d3.select('#rippleText').property('value'));
	let n = parseInt(d3.select('#nSectionsText').property('value'));
	let fc = parseFloat(d3.select('#fCenterText').property('value'));
	let gk = chebyshevTables(n,Ac);
	let sections = steppedFilter(z0,fc,er,h,gk,minW,maxW);
	let output="";
	let index;
	for (let i=0;i<sections.length;i++) {
		sections[i] = (parseFloat(sections[i])*1000).toFixed(2);
		index = i+1;
		if (!isOdd(i)) {
			output = output+"Low Impedance "+index+" : w = "+maxW.toFixed(2)+" l = "+sections[i]+"</br>";
		}
		else {
			output = output+"High Impedance "+index+" : w = "+minW.toFixed(2)+" l = "+sections[i]+"</br>";
		}
	}
	let lamda8 = [];
	let eeff = singleMicrostrip(z0,er,h,minW)[1];
	console.log(minW);
	console.log(eeff);
	console.log((er+1)/2+(er-1)/2*1/Math.sqrt(1+12*h/minW));
	lamda8[0] = parseFloat(SOL/(fc*1e6)/Math.sqrt(eeff)/8*1000).toFixed(2);
	eeff = singleMicrostrip(z0,er,h,maxW)[1];
	console.log(eeff);
	lamda8[1] = parseFloat(SOL/(fc*1e6)/Math.sqrt(eeff)/8*1000).toFixed(2);
	output = output + "</br>All line lengths should be less than eight-wavelength :"+Math.min(...lamda8);
	d3.select('#filterResults').html(output);
/*	for (let i=0;i<10;i++) {
		let w = i/10;
		console.log((er+1)/2+(er-1)/2*1/Math.sqrt(1+12*h/w));
	}*/
}
function calcLEfilter() {
	if (d3.select('#leResponseTypeSelect').property('value') == 'elliptic' && d3.select('#leFilterTypeSelect').property('value') != 'lp') {
		console.log('Elliptic response only applies to a low pass filter.');
		return;
	}
	d3.select('#leResultsDiv').html();
	let z0 = parseFloat(d3.select('#z0LEText').property('value'));
	let Ac = parseFloat(d3.select('#rippleLEText').property('value'));
	let n = parseInt(d3.select('#nSectionsLEText').property('value'));
	let f1 = parseFloat(d3.select('#f1LEText').property('value'));
	let f2 = parseFloat(d3.select('#f2LEText').property('value'));
	let f3 = parseFloat(d3.select('#f3LEText').property('value'));
	let responseType = d3.select('#leResponseTypeSelect').property('value');
	let config = d3.select('#leConfig').property('value');
	let filterType = d3.select('#leFilterTypeSelect').property('value');
	let gkArray = [];
	let outputA = [];
	let isElliptic = false;
	switch (responseType) {
		case 'butterworth':
		gkArray = butterworthTables(n);
		break;
		case 'chebyshev':
		gkArray = chebyshevTables(n,Ac);
		break;
		case 'elliptic':
		gkArray = d3.select('#gLEText').property('value').split(' ');
		isElliptic = true;
		break;
	}
/*	if (responseType == "butterworth") {
		gkArray = butterworthTables(n);
	}
	else {
		gkArray = chebyshevTables(n,Ac);
	}*/
	console.log(...gkArray);
	switch (filterType) {
		case 'lp':
		outputA = lpFilter(z0,f1,gkArray,Ac,f3,n,responseType,config);
		break;
		case 'hp':
		outputA = hpFilter(z0,f1,gkArray,Ac,f3,n,responseType,config);
		break;
		case 'bp':
		outputA = bpFilter(z0,f1,f2,gkArray,Ac,f3,n,responseType,config);
		break;
		case 'bs':
		outputA = bsFilter(z0,f1,f2,gkArray,Ac,f3,n,responseType,config);
		break;
	}
	//console.log(outputA[0]);
	d3.select('#leResultsDiv').html("<strong>Component Values:</strong></br>"+outputA[0]+"</br></br><strong>Spice Netlist:</strong></br>"+outputA[1]);
	clearSchematic();
	displaySchematic(n,filterType,config,isElliptic);
}
function clearSchematic() {
	var myNode = document.getElementById('leMainGroup');
	while (myNode.firstChild) {
	    myNode.removeChild(myNode.firstChild);
	}
}
function displaySchematic(n,type,config,isElliptic) {
	//var type = 'lp';
	if (isElliptic) {type = 'elliptic'}
	let offLeft = 100;
	let inLength;
	if (config == 'pi') {
		inLength = 100;
	}
	else {
		inLength = 70;
	}
	var d = 'M '+offLeft+' 100 l '+inLength+' 0';
	let M,tL;
	let k = 0;
	let x = offLeft+inLength;
	let x2 = x+100;
	let x3,x4,x5,x6;
	var gL = d3.select("#leMainGroup").append("svg:g").attr("id", "inputG");
	gL.append("svg:path").attr("stroke","blue").attr("d",d);
	switch (type) {
		case 'lp':
		//let k;
		for (let i=1;i<=n;i=i+2) {
			if (config == 'pi') {
				if (i == n) {
					if (isOdd(n)) {
						d = "M "+x+" 100 "+rfhFilter.capacitorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x+" 100)");
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+20).attr("y",150).attr("font-size","10px").text("C"+i);
					}
					else {
						d = "M "+x+" 100 "+rfhFilter.inductorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i);
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+45).attr("y",85).attr("font-size","10px").text("L"+i);
					}
				}
				else {
					d = "M "+x+" 100 "+rfhFilter.capacitorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x+" 100)");
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+20).attr("y",150).attr("font-size","10px").text("C"+i);
					d = "M "+x+" 100 "+rfhFilter.inductorD;
					k = i+1;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+45).attr("y",85).attr("font-size","10px").text("L"+k);
				}
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
				d = "M "+x+" 200 "+rfhFilter.groundD;
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
			}
			else {
				if(isOdd(n) && i==n) {
					d = "M "+x+" 100 "+rfhFilter.inductorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+45).attr("y",85).attr("font-size","10px").text("L"+i);
				}
				else {
					d = "M "+x+" 100 "+rfhFilter.inductorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+45).attr("y",85).attr("font-size","10px").text("L"+i);
					k=i+1;
					d = "M "+x2+" 100 "+rfhFilter.capacitorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x2+" 100)");
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x2+20).attr("y",150).attr("font-size","10px").text("C"+k);
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
					d = "M "+x2+" 200 "+rfhFilter.groundD;
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				}
			}
			x = x+100;
			x2 = x2 + 100;
		}
		if (config == 'pi') {
			if (isOdd(n)) {
				x=x-100;
				d = 'M '+x+' 100 l 100 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
			else {
				d = 'M '+x+' 100 l 70 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
		}
		else {
			if (!isOdd(n)) {
				d = 'M '+x+' 100 l 100 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
			else {
				d = 'M '+x+' 100 l 70 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
		}
		break;

		case 'hp':
		//let k;
		for (let i=1;i<=n;i=i+2) {
			if (config == 'pi') {
				if (i == n) {
					if (isOdd(n)) {
						d = "M "+x+" 100 "+rfhFilter.inductorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x+" 100)");
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+20).attr("y",150).attr("font-size","10px").text("L"+i);
					}
					else {
						d = "M "+x+" 100 "+rfhFilter.capacitorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i);
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+45).attr("y",85).attr("font-size","10px").text("C"+i);
					}
				}
				else {
					d = "M "+x+" 100 "+rfhFilter.inductorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x+" 100)");
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+20).attr("y",150).attr("font-size","10px").text("L"+i);
					d = "M "+x+" 100 "+rfhFilter.capacitorD;
					k = i+1;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+45).attr("y",85).attr("font-size","10px").text("C"+k);
				}
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
				d = "M "+x+" 200 "+rfhFilter.groundD;
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
			}
			else {
				if(isOdd(n) && i==n) {
					d = "M "+x+" 100 "+rfhFilter.capacitorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+45).attr("y",85).attr("font-size","10px").text("C"+i);
				}
				else {
					d = "M "+x+" 100 "+rfhFilter.capacitorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+45).attr("y",85).attr("font-size","10px").text("C"+i);
					k=i+1;
					d = "M "+x2+" 100 "+rfhFilter.inductorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x2+" 100)");
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x2+20).attr("y",150).attr("font-size","10px").text("L"+k);
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
					d = "M "+x2+" 200 "+rfhFilter.groundD;
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				}
			}
			x = x+100;
			x2 = x2 + 100;
		}
		if (config == 'pi') {
			if (isOdd(n)) {
				x=x-100;
				d = 'M '+x+' 100 l 100 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
			else {
				d = 'M '+x+' 100 l 70 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
		}
		else {
			if (!isOdd(n)) {
				d = 'M '+x+' 100 l 100 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
			else {
				d = 'M '+x+' 100 l 70 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
		}
		break;

		case 'bp':
		//let x3=x-50;
		//let x4=x+50;
		//let x3,x4,x5,x6;
		for (let i=1;i<=n;i=i+2) {
			if (config == 'pi') {
				k = i+1;
				x3=x-20;
				x4=x+20;
				d = "M "+x4+" 120 "+rfhFilter.capacitorD;
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x4+" 120)");
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4+20).attr("y",170).attr("font-size","10px").text("C"+i);
				d = "M "+x3+" 120 "+rfhFilter.inductorD;
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x3+" 120)");
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				tL = d3.select("#leMainGroup").append("svg:text").attr("x",x3-20).attr("y",170).attr("font-size","10px").text("L"+i);
				if (i != n) {
					x5=x+100;
					d = "M "+x5+" 100 "+rfhFilter.capacitorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x5+45).attr("y",85).attr("font-size","10px").text("C"+k);
					d = "M "+x+" 100 "+rfhFilter.inductorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+45).attr("y",85).attr("font-size","10px").text("L"+k);
				}
				d = "M "+x+" 100 l 0 20 m -20 0 l 40 0";
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGt"+k);
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				d = "M "+x3+" 220 l 40 0";
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGb"+k);
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
				d = "M "+x+" 220 "+rfhFilter.groundD;
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
			}
			else {
				k = i+1;
				x5=x+100;
				x3=x5+80;
				x4=x5+120;
				x6=x5+100;


				d = "M "+x5+" 100 "+rfhFilter.capacitorD;
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i);
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				tL = d3.select("#leMainGroup").append("svg:text").attr("x",x5+45).attr("y",85).attr("font-size","10px").text("C"+i);
				d = "M "+x+" 100 "+rfhFilter.inductorD;
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i);
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				tL = d3.select("#leMainGroup").append("svg:text").attr("x",x+45).attr("y",85).attr("font-size","10px").text("L"+i);

				if (i != n) {
					d = "M "+x4+" 120 "+rfhFilter.capacitorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k).attr("transform","rotate(90 "+x4+" 120)");
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4+20).attr("y",170).attr("font-size","10px").text("C"+k);
					d = "M "+x3+" 120 "+rfhFilter.inductorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x3+" 120)");
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x3-20).attr("y",170).attr("font-size","10px").text("L"+k);

					d = "M "+x6+" 100 l 0 20 m -20 0 l 40 0";
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGt"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					d = "M "+x3+" 220 l 40 0";
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGb"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
					d = "M "+x6+" 220 "+rfhFilter.groundD;
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");

				}
				/*d = "M "+x+" 100 l 0 20 m -20 0 l 40 0";
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGt"+k);
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				d = "M "+x3+" 220 l 40 0";
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGb"+k);
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
				d = "M "+x+" 220 "+rfhFilter.groundD;
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");*/
			}
			if (config == 'pi') {
				x = x+200;
			}
			else {
				x=x+200;
			}
			//x2 = x2 + 100;
		}
		if (config == 'pi') {
			if (isOdd(n)) {
				x=x-200;
				d = 'M '+x+' 100 l 100 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
			else {
				d = 'M '+x+' 100 l 70 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
		}
		else {
			if (!isOdd(n)) {
				d = 'M '+x+' 100 l 100 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
			else {
				d = 'M '+x+' 100 l 70 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}

		}
		break;

		case 'bs':
		//let x3=x-50;
		//let x4=x+50;
		//let x3,x4,x5,x6;
		for (let i=1;i<=n;i=i+2) {
			if (config == 'pi') {
				k = i+1;
				x5=x+20;
				x3=x5+100;
				//x3=x5+50;
				x4=x5+50;
				d = "M "+x+" 200 "+rfhFilter.capacitorD;
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x+" 200)");
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				tL = d3.select("#leMainGroup").append("svg:text").attr("x",x-20).attr("y",240).attr("font-size","10px").text("C"+i);
				d = "M "+x+" 100 "+rfhFilter.inductorD;
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x+" 100)");
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				tL = d3.select("#leMainGroup").append("svg:text").attr("x",x-20).attr("y",150).attr("font-size","10px").text("L"+i);
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
				d = "M "+x+" 300 "+rfhFilter.groundD;
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				if (i != n) {
					d = "M "+x5+" 120 "+rfhFilter.capacitorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4).attr("y",140).attr("font-size","10px").text("C"+k);
					d = "M "+x5+" 80 "+rfhFilter.inductorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4).attr("y",70).attr("font-size","10px").text("L"+k);
					d = "M "+x+" 100 l 20 0 m 0 -20 l 0 40";
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGt"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					d = "M "+x3+" 80 l 0 40 m 0 -20 l 20 0";
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGb"+k);
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				}
			}
			else {
				k = i+1;
				x3=x+20;
				x4=x3+50;
				//x3=x5+50;
				x5=x3+120;

				d = "M "+x3+" 120 "+rfhFilter.capacitorD;
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i);
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4).attr("y",140).attr("font-size","10px").text("C"+i);
				d = "M "+x3+" 80 "+rfhFilter.inductorD;
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i);
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4).attr("y",70).attr("font-size","10px").text("L"+i);
				d = "M "+x+" 100 l 20 0 m 0 -20 l 0 40";
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGt"+i);
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				d = "M "+x5+" 100 l -20 0 m 0 -20 l 0 40";
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGb"+i);
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");

				if (i != n) {
					d = "M "+x5+" 200 "+rfhFilter.capacitorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x5+" 200)");
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x5-20).attr("y",240).attr("font-size","10px").text("C"+k);
					d = "M "+x5+" 100 "+rfhFilter.inductorD;
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x5+" 100)");
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					tL = d3.select("#leMainGroup").append("svg:text").attr("x",x5-20).attr("y",150).attr("font-size","10px").text("L"+k);
					gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
					d = "M "+x5+" 300 "+rfhFilter.groundD;
					gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				}
			}
			if (config == 'pi') {
				x = x+140;
			}
			else {
				x=x+140;
			}
			//x2 = x2 + 100;
		}
		if (config == 'pi') {
			if (isOdd(n)) {
				x=x-140;
				d = 'M '+x+' 100 l 100 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
			else {
				d = 'M '+x+' 100 l 80 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
		}
		else {
			if (!isOdd(n)) {
				d = 'M '+x+' 100 l 100 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
			else {
				d = 'M '+x+' 100 l 70 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}

		}
		break;

		case 'elliptic':
		//let x3=x-50;
		//let x4=x+50;
		//let x3,x4,x5,x6;
		for (let i=1;i<=n;i=i+2) {
			if (config == 'pi') {
				k = i+1;
				x5=x+20;
				x3=x5+100;
				//x3=x5+50;
				x4=x5+50;
				d = "M "+x+" 100 "+rfhFilter.capacitorD;
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x+" 100)");
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				tL = d3.select("#leMainGroup").append("svg:text").attr("x",x-20).attr("y",140).attr("font-size","10px").text("C"+i);
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
				d = "M "+x+" 200 "+rfhFilter.groundD;
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				if (isOdd(n)) {
					if (i != n) {
						d = "M "+x5+" 120 "+rfhFilter.capacitorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4).attr("y",140).attr("font-size","10px").text("C"+k);
						d = "M "+x5+" 80 "+rfhFilter.inductorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4).attr("y",70).attr("font-size","10px").text("L"+k);
						d = "M "+x+" 100 l 20 0 m 0 -20 l 0 40";
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGt"+k);
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						d = "M "+x3+" 80 l 0 40 m 0 -20 l 20 0";
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGb"+k);
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					}
				}
				else {
					if (i == n-1) {
						x5 = x5-20;
						x4 = x4-20;
						d = "M "+x5+" 100 "+rfhFilter.inductorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4).attr("y",85).attr("font-size","10px").text("L"+k);
					}
					else {
						d = "M "+x5+" 120 "+rfhFilter.capacitorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4).attr("y",140).attr("font-size","10px").text("C"+k);
						d = "M "+x5+" 80 "+rfhFilter.inductorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+k);
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4).attr("y",65).attr("font-size","10px").text("L"+k);
						d = "M "+x+" 100 l 20 0 m 0 -20 l 0 40";
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGt"+k);
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						d = "M "+x3+" 80 l 0 40 m 0 -20 l 20 0";
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "connectGb"+k);
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					}
				}
			}
			else {
				k = i+1;
				x3=x+20;
				x4=x+50;
				//x3=x5+50;
				x5=x+100;

				d = "M "+x+" 100 "+rfhFilter.inductorD;
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i);
				gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
				tL = d3.select("#leMainGroup").append("svg:text").attr("x",x4).attr("y",85).attr("font-size","10px").text("L"+i);
				if (isOdd(n)) {
					if (i != n) {
						d = "M "+x5+" 200 "+rfhFilter.capacitorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x5+" 200)");
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x5-20).attr("y",240).attr("font-size","10px").text("C"+k);
						d = "M "+x5+" 100 "+rfhFilter.inductorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x5+" 100)");
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x5-20).attr("y",150).attr("font-size","10px").text("L"+k);
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
						d = "M "+x5+" 300 "+rfhFilter.groundD;
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					}
				}
				else {
					if (i == n-1) {
						d = "M "+x5+" 100 "+rfhFilter.capacitorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x5+" 100)");
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x5-20).attr("y",140).attr("font-size","10px").text("C"+k);
					/*	d = "M "+x5+" 100 "+rfhFilter.inductorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x5+" 100)");
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x5-20).attr("y",150).attr("font-size","10px").text("L"+k);*/
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
						d = "M "+x5+" 200 "+rfhFilter.groundD;
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					}
					else {
						d = "M "+x5+" 200 "+rfhFilter.capacitorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x5+" 200)");
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x5-20).attr("y",240).attr("font-size","10px").text("C"+k);
						d = "M "+x5+" 100 "+rfhFilter.inductorD;
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "partG"+i).attr("transform","rotate(90 "+x5+" 100)");
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
						tL = d3.select("#leMainGroup").append("svg:text").attr("x",x5-20).attr("y",150).attr("font-size","10px").text("L"+k);
						gL = d3.select("#leMainGroup").append("svg:g").attr("id", "groundG"+i);
						d = "M "+x5+" 300 "+rfhFilter.groundD;
						gL.append("svg:path").attr("stroke","blue").attr("d",d).attr("fill","#ffffff");
					}
				}
			}
			if (config == 'pi') {
				x = x+140;
			}
			else {
				x=x+100;
			}
			//x2 = x2 + 100;
		}
		if (config == 'pi') {
			if (isOdd(n)) {
				x=x-140;
				d = 'M '+x+' 100 l 100 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
			else {
				x = x-40;
				d = 'M '+x+' 100 l 80 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
		}
		else {
			if (!isOdd(n)) {
				d = 'M '+x+' 100 l 100 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}
			else {
				d = 'M '+x+' 100 l 70 0';
				gL = d3.select("#leMainGroup").append("svg:g").attr("id", "outputG");
				gL.append("svg:path").attr("stroke","blue").attr("d",d);
			}

		}
		break;
	}
}
function validateInputs(form,callBack) {
	var noErrors = Boolean(1);
	d3.select('#'+form).selectAll('input').each(function () {
		if(d3.select(this).attr('data-rfh-validate-type') === 'float' && noErrors) {
			console.log('here');
			if (isNaN(d3.select(this).property('value'))) {
				console.log(noErrors);
				noErrors =  Boolean(0);
				//userConsole('alert','Field must be a valid number.');
				d3.select(this).node().focus();
			}
			if (parseFloat(d3.select(this).attr('data-rfh-validate-value') && d3.select(this).property('value')) <= parseFloat(d3.select(this).attr('data-rfh-validate-value'))) {
				noErrors = Boolean(0);
				//userConsole('alert','Field Must be a real number greater than '+d3.select(this).attr('data-rfh-validate-value')+'.');
				d3.select(this).node().focus();
			}
		}
	});
	if (noErrors) {
		callBack();
	}
}
function plotData() {
	var yText, titleText;
	var xText = "Width ("+rfhFilter.units+")";
	var param = d3.select('#plotTypeSelect').property('value');
	var zData = [];
	var data = [];
	var data2 = [];
	switch (param) {
		case '' :
		param = "zeven";
		zData = rfhFilter.zeArray;
		yText = "Z Even (ohms)";
		titleText = "Z Even vs. Width";
		document.getElementById('plotTypeSelect').selectedIndex = "0";
		break;

		case 'zeven':
		zData = rfhFilter.zeArray;
		yText = "Z Even (ohms)";
		titleText = "Z Even vs. Width";
		break;

		case 'zodd':
		zData = rfhFilter.zoArray;
		yText = "Z Odd (ohms)";
		titleText = "Z Odd vs. Width";
		break;

		case 'bothZ':
		zData = rfhFilter.zeArray;
		yText = "Z Even & Z Odd (ohms)";
		titleText = "Z Even & Z Odd vs. Width";
		break;

		case 'ceven':
		zData = rfhFilter.ceArray;
		yText = "C Even (pF/m)";
		titleText = "C Even vs. Width";
		break;

		case 'codd':
		zData = rfhFilter.coArray;
		yText = "C Odd (pF/m)";
		titleText = "C Odd vs. Width";
		break;

		case 'bothC':
		zData = rfhFilter.ceArray;
		yText = "C Even & C Odd (pF/m)";
		titleText = "C Even & C Odd vs. Width";
		break;
	}
/*	if (param == "") {
		param = "zeven";
		document.getElementById('plotTypeSelect').selectedIndex = "0";
	}

	if (param == 'zeven' || param == 'both') {
		zData = rfhFilter.zeArray;
		yText = "Zeven (ohms)";
		titleText = "Zeven vs. Width";
	}
	else if (param == 'zezo') {
		zData = rfhFilter.zezoArray;
		yText = String.fromCharCode(8730)+"(Zeven x Zodd) (ohms)";
		titleText = String.fromCharCode(8730)+"(Zeven x Zodd) vs. Width";
	}
	else  {
		zData = rfhFilter.zoArray;
		yText = "Zodd (ohms)";
		titleText = "Zodd vs. Width";
	}*/

	for (let t=0;t<rfhFilter.wArray.length;t++) {
		data.push({
			x:rfhFilter.wArray[t],
			y:zData[t]
		});
	}
	if (param == 'bothZ') {
		for (let t=0;t<rfhFilter.wArray.length;t++) {
			data2.push({
				x:rfhFilter.wArray[t],
				y:rfhFilter.zoArray[t]
			});
		}
	}
	if (param == 'bothC') {
		for (let t=0;t<rfhFilter.wArray.length;t++) {
			data2.push({
				x:rfhFilter.wArray[t],
				y:rfhFilter.coArray[t]
			});
		}
	}
	var xTckSize;
	var xWidth = 960;
	var margin = {top: 50, right: 100, bottom: 100, left: 100},
    width = 500,
    height = 500;
	clearPlot();
	var domMaxX = (parseFloat(Math.max(...rfhFilter.wArray))).toFixed(3);
	var domMinX = (parseFloat(Math.min(...rfhFilter.wArray))).toFixed(3);
	var x = d3.scaleLinear().domain([domMinX,domMaxX]).range([0,width]).nice(8);
	var xAxis = d3.axisBottom().scale(x).tickSizeInner(-height).tickSizeOuter(0).tickPadding(10);
	xTickSize = xAxis.tickSize();
	var svg = d3.select("#dataPlotDiv").append("svg").attr("width", rfhFilter.plotSVGWidth).attr("height", rfhFilter.plotSVGHeight).attr('id','plotSVG').append("g");
	if (param != 'bothZ' || param != 'bothC') {
		var domMaxY = (parseFloat(Math.max(...zData))).toFixed(0);
		var domMinY = (parseFloat(Math.min(...zData))).toFixed(0);
		//domMinY = domMinY-10;
		console.log(domMinY);
	}
	else {
		var domMaxY = (parseFloat(Math.max(...rfhFilter.zeArray,...rfhFilter.zoArray))).toFixed(0);
		var domMinY = (parseFloat(Math.min(...rfhFilter.zeArray,...rfhFilter.zoArray))).toFixed(0);
		//domMinY = domMinY-10;
		console.log(domMinY);
	}
	/*if (action == 'updateY') {
		domMax = d3.select("#yAxisMaxInput").property('value');
		domMin = d3.select("#yAxisMinInput").property('value');
	}
	else {

	}*/
	var y = d3.scaleLinear().domain([domMinY,domMaxY]).range([height,0]).nice(8);
    var yAxis = d3.axisLeft().scale(y).tickSizeInner(-width).tickSizeOuter(0).tickPadding(10);
	var line = d3.line()
    .x(function(d) { return x(d.x); })
    .y(function(d) { return y(d.y); });
	svg.append("g")
	    .attr("class", "x axis").attr("transform","translate("+margin.left+","+(height+margin.top)+")")
	    .call(xAxis);
	svg.append("g")
	    .attr("class", "y axis").attr("transform","translate("+margin.left+","+margin.top+")")
	    .call(yAxis);
	    //Plot is shifted down 50 and left 100. Therefore plot needs to be transormed by 100,50.
	svg.append("path")
      	.datum(data)
      	.attr("id","plotLine")
      	.attr("d", line).attr("transform","translate("+margin.left+","+margin.top+")")
      	.attr("class", "lineNF")
      	.attr("stroke","#0000ff");
   	svg.append("text")
   		.attr("id","plotYAxesText")
    	.attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
       	.attr("transform", "translate("+ (margin.left/2) +","+(height/2+margin.top)+")rotate(-90)")
      	.text(yText);
    svg.append("text")
   		.attr("id","plotXAxesText")
    	.attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
       	.attr("transform", "translate("+ (margin.left+width/2) +","+(height+margin.top+parseInt(d3.select(".axis").attr("font-size"))+50)+")")
      	.text(xText);
    svg.append("text")
   		.attr("id","plotTitle")
    	.attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
       	.attr("transform", "translate("+ (margin.left+width/2) + ","+margin.top+")")
      	.text(titleText);
    if (param == 'bothZ' || param == 'bothC') {
    	var line2 = d3.line()
    	.x(function(d) { return x(d.x); })
    	.y(function(d) { return y(d.y); });
	    svg.append("path")
	      	.datum(data2)
	      	.attr("id","plotLine2")
	      	.attr("d", line2).attr("transform","translate("+margin.left+","+margin.top+")")
	      	.attr("class", "lineNF")
	      	.attr("stroke","#cccccc");
	}
}
function freezePlot() {
	if (!rfhCascade.plotFrozen) {
		rfhCascade.plotFrozen = true;
		rfhCascade.dataOutputFreeze = rfhCascade.dataOutput;
	}
	else {
		rfhCascade.plotFrozen = false;
		rfhCascade.dataOutputFreeze = [];
		plotData();
	}
}

function clearPlot() {
	d3.select("#dataPlotDiv").selectAll('svg').each(function() {
		d3.select(this).remove();
	});
}
function userConsole(style,text) {
	if (style == 'alert') {
		d3.select('#userConsoleDiv').html(d3.select('#userConsoleDiv').html()+"<br \><span style='color:red;font-weight:bold'>"+text+"</span>");
	}
	else {
		d3.select('#userConsoleDiv').html(d3.select('#userConsoleDiv').html()+"<br \><span style='color:black;font-weight:normal'>"+text+"</span>");
	}
	//d3.select('#userConsoleDiv').scrollTop = d3.select('#userConsoleDiv').scrollHeight;
	jQuery('#userConsoleDiv').scrollTop(200);
}
function isValid(str){
	 	return !/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str);
}
///RF Filter Code///////
/*
This program calculates the LC and C values for a given filter topology.
The inputs are: z0, f0, bw, and coeffecients.
*/
function bsFilter(z0,f1,f2,gk,ac,f3,n,type,config) {
	var lsr,lsh,csr,csh,reactanceType;
	var outputText = "";
	var spice = "";
	var finalText = [];
	f1 = f1*1e6;
	f2 = f2*1e6;
	f3 = f3*1e6;
	let bw = f2 - f1;
	let f0 = Math.sqrt(f2*f1);
	let ratio = f1/bw*(f3/f1-f1/f3);
	let ratioB = f3/f1;
	let IL;
	if (type == 'butterworth') {
		IL = 10*Math.log10(1+Math.pow(ratioB,2*n));
	}
	else {
		IL = 10*Math.log10(1+(Math.pow(10,ac/10)-1)*Math.pow(Math.cosh(n*Math.acosh(ratio)),2));
	}
	if (config == 'pi') {
		let i = 1;
		let m = 3;
		let j = 2;
		for (let k=0;k<gk.length;k++) {
			if (!isOdd(k)) {
				lsh = parseFloat(z0/(gk[k]*2*PI*bw));
				csh = parseFloat(gk[k]*2*PI*bw/(z0*Math.pow(2*PI*f0,2)));
				spice = spice + "l"+i+" "+i+" "+j+" "+lsh+"</br>";
				lsh = (lsh*1e9).toFixed(2);
				spice = spice + "c"+i+" "+j+" 0 "+csh+"</br>";
				csh = (csh*1e12).toFixed(2);
				outputText = outputText+"L"+i+": "+lsh+" nH"+"</br>";
				outputText = outputText+"C"+i+": "+csh+" pF"+"</br>";
				//reactanceType = "Series LC in Shunt";
			}
			else {
				lsr = parseFloat(gk[k]*2*PI*z0*bw/Math.pow(2*PI*f0,2));
				csr = parseFloat(1/(gk[k]*2*PI*bw*z0));
				spice = spice + "l"+i+" "+i+" "+j+" "+lsr+"</br>";
				lsr = (lsr*1e9).toFixed(2);
				spice = spice + "c"+i+" "+i+" "+j+" "+csr+"</br>";
				csr = (csr*1e12).toFixed(2);
				outputText = outputText+"L"+i+": "+lsr+" nH"+"</br>";
				outputText = outputText+"C"+i+": "+csr+" pF"+"</br>";
				//reactanceType = "Shunt LC in Series";
			}
			i++;
			m++;
			j++;
		}
	}
	else {
		let i = 1;
		let m = 3;
		let j = 2;
		for (let k=0;k<gk.length;k++) {
			if (!isOdd(k)) {
				lsr = parseFloat(gk[k]*2*PI*z0*bw/Math.pow(2*PI*f0,2));
				csr = parseFloat(1/(gk[k]*2*PI*bw*z0));
				spice = spice + "l"+i+" "+i+" "+j+" "+lsr+"</br>";
				lsr = (lsr*1e9).toFixed(2);
				spice = spice + "c"+i+" "+i+" "+j+" "+csr+"</br>";
				csr = (csr*1e12).toFixed(2);
				outputText = outputText+"L"+i+": "+lsr+" nH"+"</br>";
				outputText = outputText+"C"+i+": "+csr+" pF"+"</br>";
			}
			else {
				lsh = parseFloat(z0/(gk[k]*2*PI*bw));
				csh = parseFloat(gk[k]*2*PI*bw/(z0*Math.pow(2*PI*f0,2)));
				spice = spice + "l"+i+" "+i+" "+j+" "+lsh+"</br>";
				lsh = (lsh*1e9).toFixed(2);
				spice = spice + "c"+i+" "+j+" 0 "+csh+"</br>";
				csh = (csh*1e12).toFixed(2);
				outputText = outputText+"L"+i+": "+lsh+" nH"+"</br>";
				outputText = outputText+"C"+i+": "+csh+" pF"+"</br>";
			}
			i++;
			m++;
			j++;
		}
	}
	outputText = outputText+"</br>Insertion Loss : "+IL+" dB";
	finalText[0] = outputText;
	finalText[1] = spice;
	return finalText;
}
function bpFilter(z0,f1,f2,gk,ac,f3,n,type,config) {
	var lsr,csr,lsh,csh,reactanceType;
	var outputText = "";
	var spice = "";
	var finalText = [];
	f1 = f1*1e6;
	f2 = f2*1e6;
	f3 = f3*1e6;
	let bw = f2 - f1;
	let f0 = Math.sqrt(f2*f1);
	let ratio = f1/bw*(f3/f1-f1/f3);
	let ratioB = f1/f3;
	let IL;
	if (type == 'butterworth') {
		IL = 10*Math.log10(1+Math.pow(ratioB,2*n));
	}
	else {
		IL = 10*Math.log10(1+(Math.pow(10,ac/10)-1)*Math.pow(Math.cosh(n*Math.acosh(ratio)),2));
	}
	if (config == 'pi') {
		let i = 1;
		let m = 3;
		let j = 2;
		for (let k=0;k<gk.length;k++) {
			if (!isOdd(k)) {
				lsh = parseFloat(2*PI*bw*z0/(gk[k]*Math.pow(2*PI*f0,2)));
				csh = parseFloat(gk[k]/(2*PI*bw*z0));
				spice = spice + "l"+i+" "+i+" 0 "+lsh+"</br>";
				lsh = (lsh*1e9).toFixed(2);
				spice = spice + "c"+i+" "+i+" 0 "+csh+"</br>";
				csh = (csh*1e12).toFixed(2);
				outputText = outputText+"L"+i+": "+lsh+" nH"+"</br>";
				outputText = outputText+"C"+i+": "+csh+" pF"+"</br>";
			}
			else {
				lsr = parseFloat(gk[k]*z0/(2*PI*bw));
				csr = parseFloat(2*PI*bw/(gk[k]*z0*Math.pow(2*PI*f0,2)));
				spice = spice + "l"+j+" "+i+" "+j+" "+lsr+"</br>";
				lsr = (lsr*1e9).toFixed(2);
				spice = spice + "c"+j+" "+j+" "+m+" "+csr+"</br>";
				csr = (csr*1e12).toFixed(2);
				outputText = outputText+"L"+i+": "+lsr+" nH"+"</br>";
				outputText = outputText+"C"+i+": "+csr+" pF"+"</br>";
			}
			i++;
			m++;
			j++;
		}
	}
	else {
		let i = 1;
		let m = 3;
		let j = 2;
		for (let k=0;k<gk.length;k++) {
			if (!isOdd(k)) {
				lsr = parseFloat(gk[k]*z0/(2*PI*bw));
				csr = parseFloat(2*PI*bw/(gk[k]*z0*Math.pow(2*PI*f0,2)));
				spice = spice + "l"+j+" "+i+" "+j+" "+lsr+"</br>";
				lsr = (lsr*1e9).toFixed(2);
				spice = spice + "c"+j+" "+j+" "+m+" "+csr+"</br>";
				csr = (csr*1e12).toFixed(2);
				outputText = outputText+"L"+i+": "+lsr+" nH"+"</br>";
				outputText = outputText+"C"+i+": "+csr+" pF"+"</br>";
			}
			else {
				lsh = parseFloat(2*PI*bw*z0/(gk[k]*Math.pow(2*PI*f0,2)));
				csh = parseFloat(gk[k]/(2*PI*bw*z0));
				spice = spice + "l"+i+" "+j+" 0 "+lsh+"</br>";
				lsh = (lsh*1e9).toFixed(2);
				spice = spice + "c"+i+" "+j+" 0 "+csh+"</br>";
				csh = (csh*1e12).toFixed(2);
				outputText = outputText+"L"+i+": "+lsh+" nH"+"</br>";
				outputText = outputText+"C"+i+": "+csh+" pF"+"</br>";
			}
			i++;
			m++;
			j++;
		}
	}
	outputText = outputText+"</br>Insertion Loss : "+IL+" dB";
	finalText[0] = outputText;
	finalText[1] = spice;
	return finalText;
}
function lpFilter(z0,f1,gk,ac,f3,n,type,config) {
	var csh, lsr;
	var outputText="";
	var finalText  = [];
	let ratio = f3/f1;
	let lastNode;
	f1 = f1*1e6;
	let IL;
	let spice = "";
	let m;
	switch (type) {
		case 'butterworth':
		IL = 10*Math.log10(1+Math.pow(ratio,2*n)).toFixed(2);
		break;
		case 'chebyshev':
		IL = 10*Math.log10(1+(Math.pow(10,ac/10)-1)*Math.pow(Math.cosh(n*Math.acosh(ratio)),2)).toFixed(2);
		break;
		default:
		IL = "NA";
		break;
	}
	if (type == 'elliptic') {
		let k = 0;
		let i = 1;
		let j = 1;
		//let m;
		let remainder;
		if (config == 'pi') {
			console.log(gk.length);
			while (k<gk.length) {
				//i = k+1;
				remainder = k%3;
				if (remainder == 0) {
					//csh = parseFloat(gk[k]/(2*PI*f0*z0)*1e12).toFixed(2);
					//outputText = outputText+"C"+i+": "+csh+" pF"+"</br>";
					console.log(gk[k]);
					csh = parseFloat(gk[k]/(2*PI*f1*z0));
					spice = spice + "c"+i+" "+j+" 0 "+csh+"</br>";
					csh = (csh*1e12).toFixed(2);
					outputText = outputText+"C"+i+": "+csh+" pF"+"</br>";
					i++;
					k++;

				}
				else {
					/*lsr = parseFloat(gk[i]*z0/(2*PI*f0)*1e9).toFixed(2);
					csh = parseFloat(gk[i+1]/(2*PI*f0*z0)*1e12).toFixed(2);
					outputText = outputText+"L"+i+": "+lsr+" nH"+"</br>";
					outputText = outputText+"C"+i+": "+csh+" pF"+"</br>";*/
					console.log(gk[k]);
					console.log(gk[k+1]);
					m = j+1;
					lsr = parseFloat(gk[k]*z0/(2*PI*f1));
					spice = spice + "l"+i+" "+j+" "+m+" "+lsr+"</br>";
					lsr = (lsr*1e9).toFixed(2);
					outputText = outputText+"L"+i+": "+lsr+" nH"+"</br>";
					if (k+1 != gk.length) {
						csh = parseFloat(gk[k+1]/(2*PI*f1*z0));
						spice = spice + "c"+i+" "+j+" "+m+" "+csh+"</br>";
						csh = (csh*1e12).toFixed(2);
						outputText = outputText+"C"+i+": "+csh+" pF"+"</br>";
					}
					j++;
					k=k+2;
					i++;
				}
			}

			lastNode = m;
		}
		else {
			m = 2;
			let z;
			while (k<gk.length) {
				console.log(j);
				//i = k+1;
				remainder = k%3;
				if (remainder == 0) {
					//console.log(remainder);
					lsr = parseFloat(gk[k]*z0/(2*PI*f1));
					k++;
					spice = spice + "l"+i+" "+j+" "+m+" "+lsr+"</br>";
					lsr = (lsr*1e9).toFixed(2);
					outputText = outputText+"L"+i+": "+lsr+" nH"+"</br>";
					j = (m==2) ? 2 : j+2;
					i++;
					m++;
				}
				else {
					//console.log(remainder);
					//console.log(gk[k+1]);
					z=m-1;
					if (k+1 != gk.length) {
						lsr = parseFloat(gk[k]*z0/(2*PI*f1));
						spice = spice + "l"+i+" "+i+" "+m+" "+lsr+"</br>";
						lsr = (lsr*1e9).toFixed(2);
						outputText = outputText+"L"+i+": "+lsr+" nH"+"</br>";
						z=m;
					}
					if (k == gk.length-1) {
						csh = parseFloat(gk[k]/(2*PI*f1*z0));
					}
					else {
						csh = parseFloat(gk[k+1]/(2*PI*f1*z0));
					}
					spice = spice + "c"+i+" "+z+" 0 "+csh+"</br>";
					csh = (csh*1e12).toFixed(2);
					outputText = outputText+"C"+i+": "+csh+" pF"+"</br>";
					//j++;
					k=k+2;
					i++;
					m++;
				}
			}
			lastNode = (isOdd(n)) ? m-1 : m-2;
			console.log(m);
			//lastNode = m-2;
		}
	}
	else {
		let k = 0;
		let i;
		let j = 1;
		//let m;
		for (k=0;k<gk.length;k++) {
			i = k+1;
			if (config == 'pi') {
				if (isOdd(k+1)) {
					csh = parseFloat(gk[k]/(2*PI*f1*z0));
					spice = spice + "c"+i+" "+j+" 0 "+csh+"</br>";
					csh = (csh*1e12).toFixed(2);
					outputText = outputText+"C"+i+": "+csh+" pF"+"</br>";
				}
				else {
					m = j+1;
					lsr = parseFloat(gk[k]*z0/(2*PI*f1));
					spice = spice + "l"+i+" "+j+" "+m+" "+lsr+"</br>";
					lsr = (lsr*1e9).toFixed(2);
					outputText = outputText+"L"+i+": "+lsr+" nH"+"</br>";
					j++;
				}
			}
			else {
				if (isOdd(k+1)) {
					m = j+1;
					lsr = parseFloat(gk[k]*z0/(2*PI*f1));
					spice = spice + "l"+i+" "+j+" "+m+" "+lsr+"</br>";
					lsr = (lsr*1e9).toFixed(2);
					outputText = outputText+"L"+i+": "+lsr+" nH"+"</br>";
					j++;
				}
				else {
					csh = parseFloat(gk[k]/(2*PI*f1*z0));
					spice = spice + "c"+i+" "+j+" 0 "+csh+"</br>";
					csh = (csh*1e12).toFixed(2);
					outputText = outputText+"C"+i+": "+csh+" pF"+"</br>";
				}
			}
		}
		lastNode = m;
	}
	console.log(spice);
	outputText = outputText+"</br>Insertion Loss at F3: "+IL+" dB";
	finalText[0] = outputText;
	spice = ".subckt 1 "+lastNode+"</br>"+spice;
	spice = spice+".ends";
	finalText[1] = spice;
	return finalText;
}
function hpFilter(z0,f1,gk,ac,f3,n,type,config) {
	var c, l;
	var outputText = "";
	var spice = "";
	var finalText = [];
	let ratio = f3/f1;
	f1 = f1*1e6;
	let IL;
	switch (type) {
		case 'butterworth':
		IL = 10*Math.log10(1+Math.pow(ratio,2*n)).toFixed(2);
		break;
		case 'chebyshev':
		IL = 10*Math.log10(1+(Math.pow(10,ac/10)-1)*Math.pow(Math.cosh(n*Math.acosh(ratio)),2)).toFixed(2);
		break;
		default:
		IL = "NA";
		break;
	}
	let k = 0;
	let i;
	let j = 1;
	let m;
	for (k=0;k<gk.length;k++) {
		i = k+1;
		if (config == 'pi') {
			if (isOdd(k+1)) {
				l = parseFloat(gk[k]*z0/(2*PI*f1));
				spice = spice + "l"+i+" "+j+" 0 "+l+"</br>";
				l = (l*1e9).toFixed(2);
				outputText = outputText+"L"+i+": "+l+" nH"+"</br>";
			}
			else {
				m = j+1;
				c = parseFloat(gk[k]/(2*PI*f1*z0));
				spice = spice + "c"+i+" "+j+" "+m+" "+c+"</br>";
				c = (c*1e12).toFixed(2);
				outputText = outputText+"C"+i+": "+c+" pF"+"</br>";
				j++;
			}
		}
		else {
			if (isOdd(k+1)) {
				m = j+1;
				c = parseFloat(gk[k]/(2*PI*f1*z0));
				spice = spice + "c"+i+" "+j+" "+m+" "+c+"</br>";
				c = (c*1e12).toFixed(2);
				outputText = outputText+"C"+i+": "+c+" pF"+"</br>";
				j++;
			}
			else {
				l = parseFloat(gk[k]*z0/(2*PI*f1));
				spice = spice + "l"+i+" "+j+" 0 "+l+"</br>";
				l = (l*1e9).toFixed(2);
				outputText = outputText+"L"+i+": "+l+" nH"+"</br>";
			}
		}
	}
	outputText = outputText+"</br>Insertion Loss at F1: "+IL+" dB";
	finalText[0] = outputText;
	finalText[1] = spice;
	return finalText;
}
function calcNumberSections(type,f0,f1,ac,il) {
	let n;
	let fr = parseFloat(f1/f0);
	switch (type) {
		case 'butterworth':
		n = Math.log10(Math.pow(10,0.1*il)-1)/(2*Math.log10(fr));
		break;

		case 'chebyshev':
		n = Math.acosh(Math.sqrt((Math.pow(10,0.1*il)-1)/(Math.pow(10,0.1*ac)-1)))/Math.acosh(fr);
		break;

		default:
		n = 0;
	}
	return n;
}
function permittivityEvenOdd(er,h,w,s) {
	//eree is even mode effective dielectric constant for microstrip: Bahl et al page 81
	//ereo is odd mode effective dielectric constant for microstrip: Bahl et al page 82
	var u = w/h;
	var g = s/h;
	var be = 0.564*Math.pow((er-0.9)/(er+3),0.053);
	var v = u*(20+Math.pow(g,2))/(10+Math.pow(g,2))+g*Math.pow(Math.E,-g);
	var ae = 1+Math.log((Math.pow(v,4)+Math.pow(v/52,2))/(Math.pow(v,4)+0.432))/49+Math.log(1+Math.pow(v/18.1,3))/18.7;
	var A = 1+1/49*Math.log((Math.pow(u,4)+Math.pow(u/52,2))/(Math.pow(u,4)+0.432))+1/18.7*Math.log(1+Math.pow(u/18.1,3));
	var B = 0.564*Math.pow((er-0.9)/(er+3),0.053);
	var er0 = (er+1)/2+(er-1)/2*Math.pow(1+10/u,-A*B);
	var eree = 0.5*(er+1)+0.5*(er-1)*Math.pow(1+10/v,-ae*be);
	var ao = 0.7287*(er0-0.5*(er+1))*(1-Math.pow(Math.E,-0.179*u));
	var bo = 0.747*er/(0.15+er);
	var co = bo-(bo-0.207)*Math.pow(Math.E,-0.414*u);
	var d = 0.593+0.694*Math.pow(Math.E,-0.562*u);
	var ereo = (0.5*(er+1)+ao-er0)*Math.pow(Math.E,-co*Math.pow(g,d))+er0;
	return [eree,ereo];
}
function permittivityFreq(er,h,w,f) {
	f = parseFloat(f*1e6);
	var c = 3e8;
	var u = w/h;
	var A = 1+1/49*Math.log((Math.pow(u,4)+Math.pow(u/52,2))/(Math.pow(u,4)+0.432))+1/18.7*Math.log(1+Math.pow(u/18.1,3));
	var B = 0.564*Math.pow((er-0.9)/(er+3),0.053);
	var er0 = (er+1)/2+(er-1)/2*Math.pow(1+10/u,-A*B);
	var fk = c*Math.atan(er*Math.sqrt((er0-1)/(er-er0)))/(2*PI*h*1e-3*Math.sqrt(er-er0));
	var fp = fk/(0.75+(0.75-0.332/Math.pow(er,1.73))*w/h);
	var m0 = 1+1/(1+Math.sqrt(w/h))+0.32*Math.pow(1/(1+Math.sqrt(w/h)),3);
	var mc;
	if (parseFloat(w/h) <= 0.7) {
		mc = 1+1.4/(1+w/h)*(0.15-.235*Math.pow(Math.E,-0.45*f/fp));
	}
	else {
		mc = 1;
	}
	var m = m0*mc;
	var erF = er-(er-er0)/(1+Math.pow(f/fp,m));
	return erF;
}
function zEvenOdd(z0eff,er,eree,ereo,h,w,s) {
	//er0 is effective dielectric constant: Bahl et al, page 75
	//ze is even mode impedance: Bahl et al page 82
	//zo is odd mode impedance: Bahl et al page 83
	var u = w/h;
	var g = s/h;
	var A = 1+1/49*Math.log((Math.pow(u,4)+Math.pow(u/52,2))/(Math.pow(u,4)+0.432))+1/18.7*Math.log(1+Math.pow(u/18.1,3));
	var B = 0.564*Math.pow((er-0.9)/(er+3),0.053);
	var er0 = (er+1)/2+(er-1)/2*Math.pow(1+10/u,-A*B);
	var q3 = 0.1975+Math.pow(16.6+Math.pow(8.4/g,6),-0.387)+Math.log(Math.pow(g,10)/(1+Math.pow(g/3.4,10)))/241;
	var q2 = 1+0.7519*g+0.189*Math.pow(g,2.31);
	var q1 = 0.8695*Math.pow(u,0.194);
	var q4 = (2*q1/q2)/(Math.pow(Math.E,-g)*Math.pow(u,q3)+(2-Math.pow(Math.E,-g))*Math.pow(u,-q3));
	var q5 = 1.794+1.14*Math.log(1+0.638/(g+0.517*Math.pow(g,2.43)));
	var q6 = 0.2305+Math.log(Math.pow(g,10)/(1+Math.pow(g/5.8),10))/281.3+Math.log(1+0.598*Math.pow(g,1.154))/5.1;
	var q7 = (10+190*Math.pow(g,2))/(1+82.3*Math.pow(g,3));
	var q8 = Math.pow(Math.E,-6.5-0.95*Math.log(g)-Math.pow(g/0.15,5));
	var q9 = Math.log(q7)*(q8+1/16.5);
	var q10 = 1/q2*(q2*q4-q5*Math.pow(Math.E,Math.log(u)*q6*Math.pow(u,-q9)));
	var ze = z0eff*Math.sqrt(er0/eree)*1/(1-z0eff/377*Math.sqrt(er0)*q4);
	var zo = z0eff*Math.sqrt(er0/ereo)*1/(1-z0eff/377*Math.sqrt(er0)*q10);
	var zezo = ze*zo;
	var k = (ze-zo)/(ze+zo);
	return [ze,zo,k];
}
function cEvenOdd (z0,er,h,w,s) {
	let u = w/h;
	let ustrip = singleMicrostrip(z0,er,h,w,s);
	let zc = ustrip[0];
	let er0 = ustrip[1];
	let cp = PERM0*er*w/h;
	let cf = 0.5*Math.sqrt(er0)/(SOL*zc)-cp;
	let A = Math.pow(Math.E,-0.1*Math.pow(Math.E,2.33-2.53*w/h));
	let cfe = cf/(1+A*h/s*Math.tanh(8*s/h));
	let ce = cp+cf+cfe;
	let k = s/h/(s/h+2*w/h);
	console.log(k);
	let kp = Math.sqrt(1-Math.pow(k,2));
	let ellip = 0;
	if (0 <= Math.pow(k,2) <= 0.5) {
		ellip = 1/PI*Math.log(2*(1+Math.sqrt(kp))/(1-Math.sqrt(kp)));
	}
	if (0.5 <= Math.pow(k,2) <= 1) {
		ellip = PI/Math.log(2*(1+Math.sqrt(k))/(1-Math.sqrt(k)));
	}
	let cga = PERM0*ellip;
	let cgd = PERM0*er0/PI*Math.log(1/Math.tanh(PI/4*s/h))+0.65*cf*(0.02*Math.sqrt(er0)/(s/h)+1-1/Math.pow(er0,2));
	console.log(ellip);
	console.log(cga);
	console.log(cgd);
	let co = cp+cf+cgd+cga;
	return [cp+cf,ce,co];
}
function singleMicrostrip(z0,er,h,w) {
	//Based on Bahl et.al
	var u = w/h;
	var A = 1+1/49*Math.log((Math.pow(u,4)+Math.pow(u/52,2))/(Math.pow(u,4)+0.432))+1/18.7*Math.log(1+Math.pow(u/18.1,3));
	var B = 0.564*Math.pow((er-0.9)/(er+3),0.053);
	//var er0 = (er+1)/2+(er-1)/2*Math.pow(1+10/u,-A*B);
	var er0 = (er+1)/2+(er-1)/2*1/Math.sqrt(1+12/u);
	var fu = 6+(2*PI-6)*Math.pow(Math.E,-Math.pow(30.666/u,0.7528));
	var z0eff = 60/Math.sqrt(er0)*Math.log(fu/u+Math.sqrt(1+Math.pow(2/u,2)));
	return [z0eff,er0];
}
function microstripCap(er,h,w) {
	let u = w/h;
	let er0 = (er+1)/2+(er-1)/2*1/Math.sqrt(1+12/u);
	let cap;
	if (u <= 1) {
		cap = er0/(60*SOL*Math.log(8*h/w+w/(4*h)));
	}
	else {
		cap = PERM0*er0*(w/h+2.42-0.44*h/w+Math.pow(1-h/w,6));
	}
	return cap;
}
function pclFilterZ(fu,fl,z0,g0,g1,loc) {
	fu = fu*1e6;
	fl = fl*1e6;
	//var f1 = 318.35e6;
	var f0 = (fu+fl)/2;
	var fbw = (fu-fl)/f0;
	if (loc == 0) {
		var K = z0/Math.sqrt(PI*fbw/(2*g0*g1));
	}
	else {
		var K = z0*2*Math.sqrt(g0*g1)/(PI*fbw);
	}
	//var K = PI*fbw/(4*PI*f1*Math.sqrt(g0*g1));
	var ze = z0*(1+z0/K+Math.pow(z0/K,2));
	var zo = z0*(1-z0/K+Math.pow(z0/K,2));
	return [ze,zo];
}
function idFilterC(er,fbw,h,w,y0,y1,g0,g1,loc) {
	let cs,cij;
	let v = SOL/((er+1)/2+(er-1)/2*1/Math.sqrt(1+12/(w/h)));
	let theta = PI/2*(1-fbw/2);
	let y = y1/Math.tan(theta);
	let j = y/Math.sqrt(g0*g1);
	let Yij = j*Math.sin(theta);
	if (loc == 0) {
		cs = (y1-Yij)/v;
	}
	else {
		cs = (y1-yij-y0);
		cij = Yij/v;
	}
	return [cs,cij,Yij];
}
function calculateZ(er,h,w,t) {
	var Z;
	var deltaW = t/Math.PI*Math.log((4*Math.E)/Math.sqrt(Math.pow(t/h,2)+Math.pow((1/Math.PI)/(w/t+1.1),2)));
	var deltaWp = deltaW*((1+1/er)/2);
	w = w + deltaWp;
	if (w/h <= 1) {
		var Eeff = (er+1)/2+(er-1)/2*(1/(Math.sqrt(1+12*h/w))+0.04*Math.pow(1-w/h,2));
		Z = 60/Math.sqrt(Eeff)*Math.log(8*h/w+w/(4*h));
	}
	else {
		var Eeff = (er+1)/2+(er-1)/2*1/(Math.sqrt(1+12*h/w));
		Z = 120*Math.PI/(Math.sqrt(Eeff)*(w/h+1.393+0.667*Math.log(w/h+1.444)));
	}
	return Z;
}
function calculateW(er,h,z0,p) {
	var tol = 0.025;
	var finalZu = z0+z0*p;
	var finalZl = z0-z0*p;
	var z = 0;
	var w = 0.025;
	var i = 0;
	while (z < finalZl || z > finalZu) {
		z = calculateZ(er,h,w,.001);
		w = w+tol;
		i++;
		if(i >=10000) {
			z=finalZl;
		}
	}
	console.log(i);
	return w-tol;
}
function pclFilterW(er,z0,h,s,ze,zo,acc) {
	var eree,ereo,z0eff;
	var startW = calculateW(er,h,z0,0.01);
	var tol = 0.010;
	var minW = 0.125;
	var maxW = h*10;
	console.log(ze);
	var count = parseInt((maxW-startW)/tol);
	//console.log(count);
	var p = 0.01;
	//var finalZeu = ze+ze*p;
	//var finalZel = ze-ze*p;
	//var finalZou = zo+zo*p;
	//var finalZol = zo-zo*p;
	var wu = startW;
	var wl = startW;
	var w;
	var i = 0;
	//var endWe,endWo;
	var endW = 0;
	//var za = 0;
	//var zb = 0;
	//var zeError, zoError;
	var erArray = [];
	var zArray = [];
	for (let i=0;i<count;i++) {
		w = isOdd(i) ? wu : wl;
		erArray = permittivityEvenOdd(er,h,w,s);
		z0eff = singleMicrostrip(z0,er,h,w)[0];
		zArray = zEvenOdd(z0eff,er,erArray[0],erArray[1],h,w,s);
		if (Math.abs(1-zArray[0]/ze) <= acc && Math.abs(1-zArray[1]/zo) <= acc) {
			endW = w;
			i = count*2;
		}
		else {
			if (isOdd(i)) {wu = wu+tol;}
			else {
				wl=wl-tol;
				wl = wl<=minW ? minW : wl;
			}
			erArray.length = 0;
			zArray.length = 0;
		}
	}
	return [endW,zArray[0],zArray[1]];
}
function idFilterW(er,z0,h,s,ze,zo,acc) {
	var eree,ereo,z0eff;
	var startW = calculateW(er,h,z0,0.01);
	var tol = 0.010;
	var minW = 0.125;
	var maxW = h*10;
	console.log(ze);
	var count = parseInt((maxW-startW)/tol);
	var p = 0.01;
	var wu = startW;
	var wl = startW;
	var w;
	var i = 0;
	var endW = 0;
	var erArray = [];
	var zArray = [];
	for (let i=0;i<count;i++) {
		w = isOdd(i) ? wu : wl;
		erArray = permittivityEvenOdd(er,h,w,s);
		z0eff = singleMicrostrip(z0,er,h,w)[0];
		zArray = zEvenOdd(z0eff,er,erArray[0],erArray[1],h,w,s);
		if (Math.abs(1-zArray[0]/ze) <= acc && Math.abs(1-zArray[1]/zo) <= acc) {
			endW = w;
			i = count*2;
		}
		else {
			if (isOdd(i)) {wu = wu+tol;}
			else {
				wl=wl-tol;
				wl = wl<=minW ? minW : wl;
			}
			erArray.length = 0;
			zArray.length = 0;
		}
	}
	return [endW,zArray[0],zArray[1]];
}
function findSgivenW(er,z0,h,w,ze,zo,acc) {
	var eree,ereo,z0eff;
	//var startW = calculateW(er,h,z0,0.01);
	var tol = 0.001;
	var minS = 0.01;
	var maxS = 10*h;
	//console.log(ze);
	var count = parseInt((maxS-minS)/tol);
	var p = 0.01;
	//var wu = startW;
	//var wl = startW;
	var s = minS;
	//var i = 0;
	var endS;
	let erArray = [];
	var zArray = [];
	var i;
	//count = 100;
	for (i=0;i<count;i++) {
		//w = isOdd(i) ? wu : wl;
		erArray = permittivityEvenOdd(er,h,w,s);
		z0eff = singleMicrostrip(z0,er,h,w)[0];
		zArray = zEvenOdd(z0eff,er,erArray[0],erArray[1],h,w,s);
		//console.log(...zArray);
		if (Math.abs(1-parseFloat(zArray[0]).toFixed(2)/ze) <= acc && Math.abs(1-parseFloat(zArray[1]).toFixed(2)/zo) <= acc) {
			endS = s;
			console.log("got s");
			i = count*2;
		}
		else {
			s = s + tol;
		}
	}
	return [endS,zArray[0],zArray[1]];
}
function steppedFilter(z0,f0,er,h,gk,minW,maxW) {
	f0 = f0*1e6;
	let lengthA = [];
	let stripLow = [];
	let striphigh = [];
	stripLow = singleMicrostrip(z0,er,h,maxW);
	let zLow = stripLow[0];
	let betaLow = 2*PI*f0/SOL*Math.sqrt(stripLow[1]);
	//let betaLow = 7.037e-3;
	console.log(betaLow);
	stripHigh = singleMicrostrip(z0,er,h,minW);
	let zHigh = stripHigh[0];
	let betaHigh = 2*PI*f0/SOL*Math.sqrt(stripHigh[1]);
	//let betaHigh = 7.561e-3;
	console.log(betaHigh);
	for (let i=0;i<gk.length;i++) {
		if(!isOdd(i)) {
			lengthA.push(gk[i]*zLow/(betaLow*z0));
			console.log(gk[i]*zLow/(betaLow*z0));
		}
		else {
			lengthA.push(gk[i]*z0/(zHigh*betaHigh));
			console.log(gk[i]*z0/(zHigh*betaHigh));
		}

	}
	console.log(...stripLow);
	console.log(...stripHigh);
	return lengthA;
}
function pclFilterWOLD(er,z0,h,s,ze,zo) {
	var eree,ereo,z0eff;
	var startW = calculateW(er,h,z0,0.01);
	console.log(startW);
	var tol = 0.010;
	var minW = 0.125;
	var maxW = h*10;
	var p = 0.01;
	var finalZeu = ze+ze*p;
	var finalZel = ze-ze*p;
	var finalZou = zo+zo*p;
	var finalZol = zo-zo*p;
	var wu = startW;
	var wl = startW;
	var i = 0;
	var endWe,endWo;
	var za = 0;
	var zb = 0;
	eree = permittivityEvenOdd(er,h,wu,s)[0];
	z0eff = singleMicrostrip(z0,er,h,wu)[0];
	za = zEvenOdd(z0eff,er,eree,ereo,h,wu,s)[0];
	while (za < finalZel || za > finalZeu) {
		if (isOdd(i)) {
			eree = permittivityEvenOdd(er,h,wu,s)[0];
			ereo = permittivityEvenOdd(er,h,wu,s)[1];
			z0eff = singleMicrostrip(z0,er,h,wu)[0];
			za = zEvenOdd(z0eff,er,eree,ereo,h,wu,s)[0];
			wu = wu+tol;
			endWe = wu;
		}
		else {
			eree = permittivityEvenOdd(er,h,wl,s)[0];
			ereo = permittivityEvenOdd(er,h,wl,s)[1];
			z0eff = singleMicrostrip(z0,er,h,wl)[0];
			za = zEvenOdd(z0eff,er,eree,ereo,h,wl,s)[0];
			if (wl == minW) {
				wl = minW;
			}
			else {
				wl = wl-tol;
			}
			endWe = wl+tol;
		}
		i++;
		if(i >=1000) {
			za=finalZel;
			endWe = "NS";
		}
	}
	wu = startW;
	wl = startW;
	i = 0;
	while (zb < finalZol || zb > finalZou) {
		if (isOdd(i)) {
			eree = permittivityEvenOdd(er,h,wu,s)[0];
			ereo = permittivityEvenOdd(er,h,wu,s)[1];
			z0eff = singleMicrostrip(z0,er,h,wu)[0];
			zb = zEvenOdd(z0eff,er,eree,ereo,h,wu,s)[1];
			wu = wu+tol;
			endWo = wu;
		}
		else {
			eree = permittivityEvenOdd(er,h,wl,s)[0];
			ereo = permittivityEvenOdd(er,h,wl,s)[1];
			z0eff = singleMicrostrip(z0,er,h,wl)[0];
			zb = zEvenOdd(z0eff,er,eree,ereo,h,wl,s)[1];
			if (wl == minW) {
				wl = minW;
			}
			else {
				wl = wl-tol;
			}
			endWo = wl+tol;
		}
		i++;
		if(i >=1000) {
			zb=finalZol;
			endWo = "NS";
		}
	}
	return [endWe,za,endWo,zb];
}
function chebyshevTables(n,Ac) {
	//let g0 = 1.000;
	var tableRow;
	var gkArray = [];
	var gn, ak, bk, gk, akPrev, bkPrev, gkPrev, beta, gamma;
	for (let k=1;k<=n;k++) {
		ak = Math.sin((2*k-1)*PI/(2*n));
		beta = Math.log(1/Math.tanh(Ac/17.37));
		gamma = Math.sinh(beta/(2*n));
		bk = Math.pow(gamma,2)+Math.pow(Math.sin(k*PI/n),2);
		if (k == 1) {
			gk = parseFloat(2*ak/gamma).toFixed(PRECISION);
			tableRow = gk;
			gkArray[k-1] = gk;
		}
		else {
			gk = parseFloat((4*akPrev*ak)/(bkPrev*gkPrev)).toFixed(PRECISION);
			tableRow = tableRow+","+gk;
			gkArray[k-1] = gk;
		}
		akPrev = ak;
		bkPrev = bk;
		gkPrev = gk;
	}
	if (isOdd(n)) {
		gn = 1.0000.toFixed(PRECISION);
	}
	else {
		gn = parseFloat(Math.pow(1/Math.tanh(beta/4),2)).toFixed(PRECISION);
	}
	tableRow = tableRow+","+gn;
	//return tableRow;
	return gkArray;
}
function butterworthTables(n) {
	let gkArray = [];
	for (let i=1;i <= n;i++) {
		gkArray.push(2*Math.sin(((2*i-1)*PI)/(2*n)));
	}
	return gkArray;
}
function isOdd(num) { return num % 2;}
/*
Determine the width and spacing for a microstrip given the ze, z0, h and er.
Start with a width close to the 50 ohm line width.
Maintain the following inequalities:
	0.1<=u<=10 or h*0.1<=w<=h*10
	0.1<=g<=10 or h*0.1<=s<=h*10
Provide a resolution for s and w (1 mil or 0.025 mm)
Set minimum width to 5 mils or 0.125 mm.
Set minimum spacing to 5 mils or 0.125 mm.
Save all solutions in a matrix (or a handful)
*/
