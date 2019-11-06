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
