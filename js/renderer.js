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
var fs = require('fs');
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