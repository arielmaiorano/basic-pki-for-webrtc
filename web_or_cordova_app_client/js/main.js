var isMozilla = window.mozRTCPeerConnection && !window.webkitRTCPeerConnection;
if (isMozilla) {
    window.webkitURL = window.URL;
    navigator.webkitGetUserMedia = navigator.mozGetUserMedia;
    window.webkitRTCPeerConnection = window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.mozRTCIceCandidate;
}

var selfView;
//var remoteView;
var signalingChannel;
//var pc;
//var peer;
var localStream;

var pcS = {};
var peerS = {};
var remoteViewS = {};
var remoteViewStxt = {};

var fingerprintSsdp = {};
var fingerprintSsen = {};
var fingerprintScms = {};

var certificadoSsen = {};
var certificadoScms = {};

var nombreSsen = {};
var nombreScer = {};
var nombreScms = {};


//xxx
var configuration = {
  "iceServers": [
  {
    "url":"stun:stun.l.google.com:19302"
  }
  /*
  {
    "url": "stun:mmt-stun.verkstad.net"
  },
  {
    "url": "turn:mmt-turn.verkstad.net",
    "username": "webrtc",
    "credential": "secret"
  }
  */
  ]
};

if (!window.hasOwnProperty("orientation"))
    window.orientation = -90;

// xxx
//window.onload = function () {
function conectarWebRTC(servidor, conferencia, usuario, conferencia_existente)	{

    //xxx
    //usuario = Math.random().toString(36).substring(2, 4);

    selfView = document.getElementById("self_view");
    //remoteView = document.getElementById("remote_view");

    if (!navigator.webkitGetUserMedia)	{
		alert('Navegador no soportado.');
		return;
	}
	
	function peerJoin() {
		signalingChannel = new SignalingChannel(servidor, usuario, conferencia);

		// another peer has joined our session
		signalingChannel.onpeer = function (evt) {

			var peer = evt.peer;
            var peerUserId = peer.getPeerUserId();
            peerS[peerUserId] = peer;

			peerS[peerUserId].onmessage = handleMessage;

            //xxx
            //console.error(usuario + ' contra ' + peerUserId);
            if (usuario.localeCompare(peerUserId) < 0)  {
                start(true, peerUserId);
            }

            var video = document.createElement('video');
            video.autoPlay = true;
            video.id = "video-" + peerUserId.replace(/[^a-zA-Z0-9]/g, "_");
            video.setAttribute('class', 'remote_view_extras');
            document.getElementById("video-container").appendChild(video);
            remoteViewS[peerUserId] = video;

            var txt = document.createElement('div');
            txt.id = "txt-" + peerUserId.replace(/[^a-zA-Z0-9]/g, "_");
            txt.setAttribute('class', 'remote_view_extras_txt blink');
            document.getElementById("video-container").appendChild(txt);
            remoteViewStxt[peerUserId] = txt;

            msgPeer("Esperando certificado y firma...", peerUserId);

            var ancho_porcent = Math.floor((100 / Object.keys(remoteViewS).length) - 3);
            for (var tmp_peerUserId in remoteViewS)  {
                remoteViewS[tmp_peerUserId].style.width = ancho_porcent + '%';
                remoteViewStxt[tmp_peerUserId].style.top = remoteViewS[tmp_peerUserId].getBoundingClientRect().top + 'px';
                remoteViewStxt[tmp_peerUserId].style.left = remoteViewS[tmp_peerUserId].getBoundingClientRect().left + 'px';
            }

			peerS[peerUserId].ondisconnect = function () {
                
                if (pcS[peerUserId])
                    pcS[peerUserId].close();
                delete pcS[peerUserId];

                delete peerS[peerUserId];

                document.getElementById("video-container").removeChild(remoteViewS[peerUserId]);
                delete remoteViewS[peerUserId];
                document.getElementById("video-container").removeChild(remoteViewStxt[peerUserId]);
                delete remoteViewStxt[peerUserId];

                if (Object.keys(remoteViewS).length > 0)    {
                    var ancho_porcent = Math.floor((100 / Object.keys(remoteViewS).length) - 3);
                    for (var tmp_peerUserId in remoteViewS)  {
                        remoteViewS[tmp_peerUserId].style.width = ancho_porcent + '%';
                        remoteViewStxt[tmp_peerUserId].style.top = remoteViewS[tmp_peerUserId].getBoundingClientRect().top + 'px';
                        remoteViewStxt[tmp_peerUserId].style.left = remoteViewS[tmp_peerUserId].getBoundingClientRect().left + 'px';
                    }
                }

			};

		};
	}

	// get a local stream
	//xxx
    //navigator.webkitGetUserMedia({ "audio": true, "video": true}, function (stream) {
    var video_constraints = {
        mandatory: {
		
			/* xxx
            minHeight: 480,
            minWidth: 640,
            maxHeight: 480,
            maxWidth: 640 
			*/
        },
        optional: []
    };
    navigator.webkitGetUserMedia({ "audio": true, "video": video_constraints}, function (stream) {
		selfView.src = URL.createObjectURL(stream);
		localStream = stream;
		selfView.style.visibility = "visible";

		peerJoin();

	}, logError);

};

// handle signaling messages received from the other peer
function handleMessage(evt) {
    var message = JSON.parse(evt.data);
    var peerUserId = evt.peerUserId;

    if (!pcS[peerUserId] && (message.sessionDescription || message.sdp || message.candidate))
        start(false, peerUserId);

    if (message.sessionDescription || message.sdp) {
        var desc = new RTCSessionDescription({
            "sdp": SDP.generate(message.sessionDescription) || message.sdp,
            "type": message.type
        });

        // xxx
        var tmp_sdp = SDP.parse(desc.sdp);
        fingerprintSsdp[peerUserId] = tmp_sdp.mediaDescriptions[0].dtls.fingerprint;

        pcS[peerUserId].setRemoteDescription(desc, function () {
            // if we received an offer, we need to create an answer
            if (pcS[peerUserId].remoteDescription.type == "offer")
                //xxx
                //pcS[peerUserId].createAnswer(localDescCreated, logError);
                pcS[peerUserId].createAnswer(function (desc) { localDescCreated2(desc, peerUserId); }, logError);

        }, logError);

    //xxx
    } else if (message.certificado) {

        //alert('message.certificado: ' + message.certificado);
        //alert('message.fingerprint: ' + message.fingerprint);
        //alert('message.firma: ' + message.firma);

        // nombre
        nombreSsen[peerUserId] = decodeURI(peerUserId);

        // firma
        fingerprintSsen[peerUserId] = message.fingerprint;

        // certificado
        var cert_arr_peer = parsearCertificados(message.certificado);
        //xxx
        if (cert_arr_peer.length > 1)  {
            msgPeer("Más de un cerficado recibido.", peerUserId, "red");
            return;
        }
        certificadoSsen[peerUserId] = cert_arr_peer[0];

        msgPeer("Certificado recibido.", peerUserId);

        /*
        var ttt = "";
        for(var i = 0; i < certificadoSsen[peerUserId].subject.types_and_values.length; i++)    {
            var typeval = certificadoSsen[peerUserId].subject.types_and_values[i].type;
            var subjval = certificadoSsen[peerUserId].subject.types_and_values[i].value.value_block.value;
            ttt += "--> " + typeval + ":" + subjval + "\n";
        }
        alert(ttt);
        */

        // validar nombre ("2.5.4.3" => CN)
        for(var i = 0; i < certificadoSsen[peerUserId].subject.types_and_values.length; i++)    {
            if (certificadoSsen[peerUserId].subject.types_and_values[i].type == "2.5.4.3")  {
                nombreScer[peerUserId] = certificadoSsen[peerUserId].subject.types_and_values[i].value.value_block.value;
            }
        }
        if (nombreScer[peerUserId] != nombreSsen[peerUserId])    {
            msgPeer("Dueño de certificado inválido.", peerUserId, "red");
            return;
        }
        msgPeer("Dueño de certificado verificado.", peerUserId);

        // certificado/s CA
        var cert_arr_ca = parsearCertificados(localStorage.CERTIFICADO_CA);

        // validar cert
        var cert_chain_simpl = new org.pkijs.simpl.CERT_CHAIN({
            trusted_certs: cert_arr_ca,
            certs: cert_arr_peer
            //, crls: crls
        });
        cert_chain_simpl.verify().
            then(
            function(result)
            {
                if (! result.result)    {
                    msgPeer("Certificado inválido.", peerUserId, "red");
                    return;
                }

                msgPeer("Certificado verificado.", peerUserId);

                // parseo de firma
                var encodedCMS = message.firma;
                var clearCMS = encodedCMS.replace(/(-----(BEGIN|END)( NEW)? CMS-----|\n)/g, '');
                var cmsSignedBuffer = stringToArrayBuffer(window.atob(clearCMS));
                var asn1 = org.pkijs.fromBER(cmsSignedBuffer);
                var cms_content_simpl = new org.pkijs.simpl.CMS_CONTENT_INFO({ schema: asn1.result });
                var cms_signed_simpl = new org.pkijs.simpl.CMS_SIGNED_DATA({ schema: cms_content_simpl.content });
                var cert_arr_ca2 = parsearCertificados(localStorage.CERTIFICADO_CA);

                // validar certificado usado para firmar
                // xxx - comparar serials
                var _cert_sig_ok = false;
                for(var j = 0; j < cms_signed_simpl.certificates.length; j++)   {
                    for(var i = 0; i < cms_signed_simpl.certificates[j].subject.types_and_values.length; i++)   {
                        if (cms_signed_simpl.certificates[j].subject.types_and_values[i].type == "2.5.4.3")  {
                            if (cms_signed_simpl.certificates[j].subject.types_and_values[i].value.value_block.value == nombreSsen[peerUserId]) {
                                _cert_sig_ok = true;
                                break;
                            }
                        }
                    }
                }
                if (_cert_sig_ok)   {
                    msgPeer("Dueño de certificado de firma verificado.", peerUserId);
                } else  {
                    msgPeer("Dueño de certificado de firma inválido.", peerUserId, "red");
                    return;
                }

                // validar contenido firmado
                fingerprintScms[peerUserId] = arrayBufferToString(cms_signed_simpl.encapContentInfo.eContent.value_block.value[0].value_block.value_hex);
                if (fingerprintSsdp[peerUserId] == fingerprintSsen[peerUserId] && fingerprintSsdp[peerUserId] == fingerprintScms[peerUserId])   {
                    msgPeer("Contenido firmado verificado.", peerUserId);
                } else  {
                    msgPeer("Contenido firmado inválido.", peerUserId, "red");
                    return;
                }

                // validar firma
                cms_signed_simpl.verify({ signer: 0, trusted_certs: cert_arr_ca2 }).
                then(
                function(result)
                {
                    if (! result)    {
                        msgPeer("Firma inválida.", peerUserId, "red");
                        return;
                    }
                    msgPeer("Firma verificada.", peerUserId);
                    msgPeer("AUTENTICADO", peerUserId, "#01DF01");
                },
                function(error)
                {
                    msgPeer("Problema al verificar firma: " + error, peerUserId, "red");
                }
                );
            },
            function(error)
            {
                msgPeer("Problema al verificar certificado: " + error.result_message, peerUserId, "red");
            }
            );


    } else if (!isNaN(message.orientation) && remoteViewS[peerUserId]) {
        var transform = "rotate(" + message.orientation + "deg)";
        remoteViewS[peerUserId].style.transform = remoteViewS[peerUserId].style.webkitTransform = transform;
    } else {
        var d = message.candidate.candidateDescription;
        if (d && !message.candidate.candidate) {
            message.candidate.candidate = "candidate:" + [
                d.foundation,
                d.componentId,
                d.transport,
                d.priority,
                d.address,
                d.port,
                "typ",
                d.type,
                d.relatedAddress && ("raddr " + d.relatedAddress),
                d.relatedPort && ("rport " + d.relatedPort),
                d.tcpType && ("tcptype " + d.tcpType)
            ].filter(function (x) { return x; }).join(" ");
        }
        pcS[peerUserId].addIceCandidate(new RTCIceCandidate(message.candidate), function () {}, logError);
    }
}

// call start() to initiate
function start(isInitiator, peerUserId) {
    
    pcS[peerUserId] = new webkitRTCPeerConnection(configuration);

    // send any ice candidates to the other peer
    pcS[peerUserId].onicecandidate = function (evt) {
        if (evt.candidate) {
            var candidate = "";
            var s = SDP.parse("m=application 0 NONE\r\na=" + evt.candidate.candidate + "\r\n");
            var candidateDescription = s && s.mediaDescriptions[0].ice.candidates[0];
            if (!candidateDescription)
                candidate = evt.candidate.candidate;
            peerS[peerUserId].send(JSON.stringify({
                "candidate": {
                    "candidate": candidate,
                    "candidateDescription": candidateDescription,
                    "sdpMLineIndex": evt.candidate.sdpMLineIndex
                }
            }));
            console.log("candidate emitted: " + evt.candidate.candidate);
        }
    };

    // once the remote stream arrives, show it in the remote video element
    pcS[peerUserId].onaddstream = function (evt) {
        remoteViewS[peerUserId].src = URL.createObjectURL(evt.stream);
		remoteViewS[peerUserId].style.visibility = "visible";
		//xxx
		remoteViewS[peerUserId].play();

		//xxx
		remoteViewS[peerUserId].onclick = function () { clickOrientation(peerUserId); };

        sendOrientationUpdate(peerUserId);
    };

	pcS[peerUserId].addStream(localStream);

    if (isInitiator)
        //pcS[peerUserId].createOffer(localDescCreated, logError);
        pcS[peerUserId].createOffer(function (desc) { localDescCreated2(desc, peerUserId); }, logError);

}

//xxx
//function localDescCreated(desc) {
function localDescCreated2(desc, peerUserId) {

    pcS[peerUserId].setLocalDescription(desc, function () {
        var sdp = "";
        var sessionDescription = SDP.parse(pcS[peerUserId].localDescription.sdp);
        if (!sessionDescription)
            sdp = pcS[peerUserId].localDescription.sdp;
        peerS[peerUserId].send(JSON.stringify({
            "sdp": sdp,
            "sessionDescription": sessionDescription,
            "type": pcS[peerUserId].localDescription.type
        }));
        var logMessage = "localDescription set and sent to peer, type: " + pcS[peerUserId].localDescription.type;
        if (sdp)
            logMessage += ", sdp:\n" + sdp;
        if (sessionDescription)
            logMessage += ", sessionDescription:\n" + JSON.stringify(sessionDescription, null, 2);
        console.log(logMessage);

        //xxx
        //alert(sessionDescription.version);
        //alert(sessionDescription.mediaDescriptions[0].dtls.fingerprint);
        
        setTimeout(function(){ enviarFirma(sessionDescription.mediaDescriptions[0].dtls.fingerprint, peerUserId); }, 5000);

    }, logError);
}


function sendOrientationUpdate(peerUserId) {
    peerS[peerUserId].send(JSON.stringify({ "orientation": window.orientation + 90 }));
}

window.onorientationchange = function () {
    
    //if (peer)
    //    sendOrientationUpdate();
    for (var peerUserId in peerS)  {
        sendOrientationUpdate(peerUserId);
    }

    if (selfView) {
        var transform = "rotate(" + (window.orientation + 90) + "deg)";
        selfView.style.transform = selfView.style.webkitTransform = transform;
    }
};


var __clickOrientation = 0;
function clickOrientation(peerUserId)	{
	__clickOrientation += 90;
	if (__clickOrientation > 360)
		__clickOrientation = 0;
	var transform = "rotate(" + __clickOrientation + "deg)";
	remoteViewS[peerUserId].style.transform = remoteViewS[peerUserId].style.webkitTransform = transform;
}

///////////////////////////////////////////////////////////////////////////////
function enviarFirma(fingerprint, peerUserId) {

    var encodedPrivateKey = localStorage.LLAVE_PRIVADA;
    var clearPrivateKey = encodedPrivateKey.replace(/(-----(BEGIN|END)( NEW)? PRIVATE KEY-----|\n)/g, '');
    var privateKeyBuffer = stringToArrayBuffer(window.atob(clearPrivateKey));
    var cert_arr = parsearCertificados(localStorage.CERTIFICADO_LOCAL);
    var cert_simpl = cert_arr[0];

    var crypto2 = org.pkijs.getCrypto();
    crypto2.importKey("pkcs8",
        privateKeyBuffer,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: {
                name: "SHA-256"
            },
        },
        true,
        ["sign"]).then(
            function(result)
            {
                var privateKey = result;
                create_CMS_Signed(fingerprint, privateKey, cert_simpl,
                    function(result2)
                    {
                        var firma_cms = result2;
                        peerS[peerUserId].send(JSON.stringify({ "certificado": localStorage.CERTIFICADO_LOCAL, "fingerprint": fingerprint, "firma": firma_cms }));
                    }
                );
            },
            function(error)
            {
                //alert("Problema al generar firma: " + error);
				msgPeer("Problema generar firma.", peerUserId);
            }
        );
}


function logError(error) {
    if (error) {
        if (error.name && error.message)
            //log(error.name + ": " + error.message);
			console.error(error.name + ": " + error.message);
        else
            //log(error);
			console.error(error);
    } else
        //log("Error (no error message)");
		console.error("Error (no error message)");
}

function log(msg) {
    //log.div = log.div || document.getElementById("log_div");
    //log.div.appendChild(document.createTextNode(msg));
    //log.div.appendChild(document.createElement("br"));
	console.log(msg);
}

// ////////////////////////////////////////////////////////////////////////////////////////

function msgPeer(msg, peerUserId, color) {
    color = color || 'yellow';
    var tmp = '';
    if (color != 'yellow')  {
        msg = decodeURI(peerUserId) + ': <b>' + msg + '</b>';
    } else  {
        if (remoteViewStxt[peerUserId].innerHTML != '') {
            tmp = remoteViewStxt[peerUserId].innerHTML + '<br />';
        } else  {
            tmp = '<b>' + decodeURI(peerUserId) + '</b><br />';
        }
        //msg = tmp + new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric"}) + ': ' + msg;
        msg = tmp + msg;
    }

    remoteViewStxt[peerUserId].innerHTML = msg;
    remoteViewStxt[peerUserId].style.color = color;

    if (! _msgPeerBlink_started)    {
        window.setInterval(msgPeerBlink, 1000);
        _msgPeerBlink_started = true;
    }
}
_msgPeerBlink_started = false;
function msgPeerBlink() {
    try{
        $('.blink').fadeOut(500);
        $('.blink').fadeIn(500);
    } catch(e) {}
}


