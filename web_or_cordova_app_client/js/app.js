var deviceReadyDeferred = $.Deferred();
var jqmReadyDeferred = $.Deferred();

$(document).on("deviceready", function() {
  deviceReadyDeferred.resolve();
});

$(document).on("mobileinit", function () {

	// chrome sec. exception
	//$.mobile.changePage.defaults.changeHash = false;
	$.mobile.hashListeningEnabled = false;
	//$.mobile.pushStateEnabled = false;

	//jqmReadyDeferred.resolve();
	var isCordovaApp = !!window.cordova;
	if (! isCordovaApp)	{
		setTimeout(function()	{
			init();
		}, 500);
	} else	{
		jqmReadyDeferred.resolve();
	}
});

$.when(deviceReadyDeferred, jqmReadyDeferred).then(init);

// ////////////////////////////////////////////////////////////////////////

var APP_NOMBRE = 'VCA';
var APP_DESCRIPCION = 'Video Conferencia Autenticada';
var APP_VERSION = '0.0.3 beta';
var APP_TEXTO_AUTOR = 'XXX - 2015';

var __SERVER_SIGNALING_URL = 'http://10.187.17.233:8080/';

var __SERVER_OPENXPKI_URL = 'http://10.187.17.233/openxpki/';
var __CERT_CA = `

CN=CA ONE,OU=Test CA,DC=OpenXPKI,DC=ORG
-----BEGIN CERTIFICATE-----
MII...

A COMPLETAR! (app.js)

-----END CERTIFICATE-----

CN=Root CA,OU=Test CA,DC=OpenXPKI,DC=ORG
-----BEGIN CERTIFICATE-----
MII...

A COMPLETAR! (app.js)

-----END CERTIFICATE-----

`;

// ////////////////////////////////////////////////////////////////////////

function init() {

	// cuestiones de performance generales
	$.mobile.defaultPageTransition   = 'none';
	$.mobile.defaultDialogTransition = 'none';
	$.mobile.buttonMarkup.hoverDelay = 0;

	// presentar splash screen
	pagina_splash();

	// cargar configuración local
	cargarConfLocal();

	// incio de acuerdo a configuración actual
	var splash_secs = 3000;
	if (location.href.indexOf('nosplash') >= 0)	{
		splash_secs = 0;
	}
	setTimeout(function()	{
		pagina_inicial();
	}, splash_secs);

}

// ////////////////////////////////////////////////////////////////////////////

function cargarConfLocal()	{
	if (! localStorage.CERTIFICADO_CA)	{
		localStorage.CERTIFICADO_CA = __CERT_CA;
	}
	if (! localStorage.NOMBRE_COMPLETO)	{
		localStorage.NOMBRE_COMPLETO = '';
	}
	if (! localStorage.LLAVE_PRIVADA || ! localStorage.LLAVE_PUBLICA)	{
		localStorage.LLAVE_PRIVADA = '';
		localStorage.LLAVE_PUBLICA = '';
	}
	if (! localStorage.CERTIFICADO_LOCAL_CSR)	{
		localStorage.CERTIFICADO_LOCAL_CSR = '';
	}
	if (! localStorage.CERTIFICADO_LOCAL)	{
		localStorage.CERTIFICADO_LOCAL = '';
	}
	if (! localStorage.SERVIDOR_URL)	{
		localStorage.SERVIDOR_URL = __SERVER_SIGNALING_URL;
	}
}

// ////////////////////////////////////////////////////////////////////////////



// ////////////////////////////////////////////////////////////////////////////

// página de splash
function pagina_splash()	{
	var html = '';
	html += '<div data-role="page" id="pagina" class="app-page" style="background-color: #ffffff;">';
	html += '	<div role="main" class="ui-content">';
	html += '		<div style="height: 100%; width: 100%; text-align: center; margin: 0 auto;">';
	html += '			<img src="img/logo_cd.png" style="width: 60px; height:auto;" />';
	html += '			<h3>'+ APP_NOMBRE +'</h3><b>'+ APP_DESCRIPCION +'</b><br />Versión '+ APP_VERSION +'<br />' + APP_TEXTO_AUTOR;
	html += '			<br /><br />';
	html += '			<img src="img/logo_ea.png" style="width: 60px; height:auto;" />';
	html += '		</div>';
	html += '	</div>';
	html += '</div>';
	cargar_pagina(html);
}

// página de incio
function pagina_inicial()	{
	var html = '';
	html += html_encabezado({texto: 'salir', onclick: 'salir()', icono: 'delete'}, null);
	html += '<div>';
	html += '    <ul data-role="listview" data-inset="true">';
	html += '        <li data-role="divider">CONFIGURACIÓN</li>';
	html += '        <li><a href="#" onclick="pagina_conf_cert_ca()">Certificado de AC</a></li>';
	html += '        <li><a href="#" onclick="pagina_conf_cert_local()">Certificado Propio</a></li>';
	html += '        <li><a href="#" onclick="pagina_conf_servidor()">Servidor de Señalización</a></li>';
	html += '        <li><a href="#" onclick="limpiar()">Limpiar Datos</a></li>';
	html += '    </ul>';
	html += '    <button onclick="conectar()" class="ui-btn ui-icon-check ui-btn-icon-left ui-corner-all">CONECTAR</button>';
	html += '</div>';
	html += html_pie('');
	cargar_pagina(html);
}

// xxx
function salir()	{
	pagina_splash();
}
function limpiar()	{
	if (confirm('Eliminar todos los datos registrados?'))	{
		localStorage.CERTIFICADO_CA = __CERT_CA;
		localStorage.NOMBRE_COMPLETO = '';
		localStorage.LLAVE_PRIVADA = '';
		localStorage.LLAVE_PUBLICA = '';
		localStorage.CERTIFICADO_LOCAL_CSR = '';
		localStorage.CERTIFICADO_LOCAL = '';
		localStorage.SERVIDOR_URL = __SERVER_SIGNALING_URL;
		toast("Información eliminada.");
	}
}


// página de configuración de cert. AC
function pagina_conf_cert_ca()	{
	var html = '';
	html += html_encabezado({texto: 'volver', onclick: 'pagina_inicial()', icono: 'carat-l'}, {texto: 'actualizar', onclick: '__pagina_conf_cert_ca()', icono: 'check'});
	html += '<div>';
	html += '	<fieldset data-role="controlgroup">';
	html += '	<legend>Certificado de Autoridad Certificante:</legend>';
	html += '	<textarea id="CERTIFICADO_CA">'+ localStorage.CERTIFICADO_CA +'</textarea>';
	html += '	</fieldset>';
	html += '</div>';
	html += html_pie('');
	cargar_pagina(html);
}
function __pagina_conf_cert_ca()	{
	localStorage.CERTIFICADO_CA = $('#CERTIFICADO_CA').val();
	toast("Información actualizada.");
	pagina_inicial();
}

// página de configuración de cert. local
function pagina_conf_cert_local()	{
	var html = '';
	html += html_encabezado({texto: 'volver', onclick: 'pagina_inicial()', icono: 'carat-l'}, {texto: 'actualizar', onclick: '__pagina_conf_cert_local()', icono: 'check'});
	html += '<div>';
	html += '	<fieldset data-role="controlgroup">';
	html += '	<legend>Certificado Local / Propio:</legend>';
	html += '	<textarea id="CERTIFICADO_LOCAL">'+ localStorage.CERTIFICADO_LOCAL +'</textarea>';
	html += '	</fieldset>';

	html += '	<hr />';

	html += '	<legend>Nombre Completo:</legend>';
	html += '	<input type="text" id="NOMBRE_COMPLETO" value="'+ localStorage.NOMBRE_COMPLETO +'" />';
	html += '	</fieldset>';

	html += '	<fieldset data-role="controlgroup">';
	html += '	<legend>Llave Pública:</legend>';
	html += '	<textarea id="LLAVE_PUBLICA">'+ localStorage.LLAVE_PUBLICA +'</textarea>';
	html += '	</fieldset>';
	html += '	<fieldset data-role="controlgroup">';
	html += '	<legend>Llave Privada:</legend>';
	html += '	<textarea id="LLAVE_PRIVADA">'+ localStorage.LLAVE_PRIVADA +'</textarea>';
	html += '	</fieldset>';
	html += '	<button onclick="__generar_llaves()" class="ui-btn ui-icon-refresh ui-btn-icon-left ui-corner-all">GENERAR LLAVES Y CSR</button>';

	html += '	<fieldset data-role="controlgroup">';
	html += '	<legend>Pedido de Firma de Certificado (CSR):</legend>';
	html += '	<textarea id="CERTIFICADO_LOCAL_CSR">'+ localStorage.CERTIFICADO_LOCAL_CSR +'</textarea>';
	html += '	</fieldset>';
	html += '	<button onclick="window.open(\''+ __SERVER_OPENXPKI_URL +'\')" class="ui-btn ui-icon-action ui-btn-icon-left ui-corner-all">ENVÍO DE CSR</button>';

	html += '</div>';
	html += html_pie('');
	cargar_pagina(html);
}
function __pagina_conf_cert_local()	{
	localStorage.CERTIFICADO_LOCAL = $('#CERTIFICADO_LOCAL').val();
	localStorage.NOMBRE_COMPLETO = $('#NOMBRE_COMPLETO').val();
	localStorage.LLAVE_PUBLICA = $('#LLAVE_PUBLICA').val();
	localStorage.LLAVE_PRIVADA = $('#LLAVE_PRIVADA').val();
	localStorage.CERTIFICADO_LOCAL_CSR = $('#CERTIFICADO_LOCAL_CSR').val();
	toast("Información actualizada.");
	pagina_inicial();
}
function __generar_llaves()	{
	var nombre = $('#NOMBRE_COMPLETO').val();
	if (nombre == '')	{
		toast('Debe especificar su "Nombre Completo".');
		return;
	}
	create_PKCS10(nombre);
	$('#CERTIFICADO_LOCAL_CSR').select();
	toast("Llaves y solicitud generadas.");
}

// página de configuración de servidor
function pagina_conf_servidor()	{
	var html = '';
	html += html_encabezado({texto: 'volver', onclick: 'pagina_inicial()', icono: 'carat-l'}, {texto: 'actualizar', onclick: '__pagina_conf_servidor()', icono: 'check'});
	html += '<div>';
	html += '	<legend>URL de servidor:</legend>';
	html += '	<input type="text" id="SERVIDOR_URL" value="'+ localStorage.SERVIDOR_URL +'" />';
	html += '	</fieldset>';
	html += '</div>';
	html += html_pie('');
	cargar_pagina(html);
}
function __pagina_conf_servidor()	{
	localStorage.SERVIDOR_URL = $('#SERVIDOR_URL').val();
	toast("Información actualizada.");
	pagina_inicial();
}

// ////////////////////////////////////////////////////////////////////////////

function conectar()	{
	if (! localStorage.NOMBRE_COMPLETO)	{
		toast('Configuración incompleta.');
		return;
	}
	ejecutarWebService(localStorage.SERVIDOR_URL + 'list/', pagina_conectados);
}

// página de listados de usuarios conectados
function pagina_conectados(json)	{
	var datos;
	try {
		datos = JSON.parse(json);
	} catch(e) { }
	if (! datos)	{
		toast('Problema al recibir datos');
		pagina_inicial();
		return;
	}
	var html = '';
	html += html_encabezado({texto: 'volver', onclick: 'pagina_inicial()', icono: 'carat-l'}, {texto: 'refrescar', onclick: '__refrescar()', icono: 'refresh'});
	html += '<div>';
	html += '    <ul data-role="listview" data-inset="true">';
	html += '        <li data-role="divider">CONFERENCIAS ACTIVAS</li>';
	for (var i=0; i<datos.sessions.length; i++)	{
		html += '        <li><a href="#" onclick="__ingresar_conferencia(\''+ datos.sessions[i].id +'\')"><h2>'+ decodeURI(datos.sessions[i].id) +'</h2><span class="ui-li-count">'+ datos.sessions[i].users.length +'</span><p><strong>'+ decodeURI(datos.sessions[i].users.join(", ")) +'</strong></p></a></li>';
	}
	if (datos.sessions.length == 0)	{
		html += '        <li><h2>No hay conferencias activas.</h2></li>';
	}
	html += '    </ul>';
	html += '	<fieldset data-role="controlgroup">';
	html += '	<legend>Nombre de nueva conferencia:</legend>';
	html += '	<input type="text" name="nueva_conferencia" id="nueva_conferencia" value="" />';
	html += '	</fieldset>';
	html += '	<button onclick="__crear_conferencia()" class="ui-btn ui-icon-video ui-btn-icon-left ui-corner-all">CREAR CONFERENCIA</button>';
	html += '</div>';
	html += html_pie('');
	cargar_pagina(html);
}

function __refrescar()	{
	ejecutarWebService(localStorage.SERVIDOR_URL + 'list/', pagina_conectados);
}
function __ingresar_conferencia(conferencia_existente)	{
	pagina_video();
	conectarWebRTC(localStorage.SERVIDOR_URL, conferencia_existente, localStorage.NOMBRE_COMPLETO, true);
}
function __crear_conferencia()	{
	var nueva_conferencia = $('#nueva_conferencia').val();
	pagina_video();
	conectarWebRTC(localStorage.SERVIDOR_URL, nueva_conferencia, localStorage.NOMBRE_COMPLETO, false);
}


// ////////////////////////////////////////////////////////////////////////////

// página de video conf.
function pagina_video()	{
	var html = '';
	html += html_encabezado({texto: 'desconectar', onclick: 'location.href = location.href + \'#nosplash\'; location.reload();', icono: 'carat-l'}, null);
	html += '	<div id="video-container">';
	html += '		<video id="self_view" autoplay muted></video>';
	//html += '		<video id="remote_view" autoplay></video>';
	html += '	</div>';
	html += html_pie('');
	cargar_pagina(html);
}



// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////

// encabezado de página común
function html_encabezado(btn_izq, btn_der)	{
	document.title = APP_NOMBRE + ' - ' + APP_DESCRIPCION;
	var html = '';
	html += '<div data-role="page" id="pagina" class="app-page" data-theme="a">';
	html += '	<div data-role="header" data-position="fixed" style="min-height: 45px;" class="ui-nodisc-icon">';
	html += '		<center>';
	//html += '		<img src="img/logo_ea.png" style="margin-top: 2px; height:35px" />';
	html += '		<img src="img/logo_cd.png" style="margin-top: 2px; height:35px" />';
	html += '		</center>';
	if (btn_izq)
		html += '		<a href="#" onclick="'+ btn_izq.onclick +'" class="ui-button" data-icon="'+ btn_izq.icono +'">'+ btn_izq.texto +'</a>';
	if (btn_der)
		html += '		<a href="#" onclick="'+ btn_der.onclick +'"  class="ui-button" data-icon="'+ btn_der.icono +'" class="ui-btn-right">'+ btn_der.texto +'</a>';
	html += '	</div>';
	html += '	<div role="main" class="ui-content">';
	return html;
}

// pie de página común
function html_pie(status)	{
	var html = '';
	html += '</div>';
	html += '<div data-role="footer" data-position="fixed">';
	html += '	<center style="font-size: 0.75em;">';
	html += '		<i>'+ APP_NOMBRE +' - '+ APP_DESCRIPCION +'</i>';
	html += '	</center>';
	html += '	<center style="font-size: 0.6em;">';
	html += '		Versión '+ APP_VERSION +' - '+ APP_TEXTO_AUTOR;
	html += '	</center>';
	//html += '	<div style="position: absolute; float:right; background-color: #ddeedd; color: #dd5555" id="status">'+ status +'</div>';
	html += '</div>';
	return html;
}

// actualizar contenido de página en dom
function cargar_pagina(html)	{
	$.mobile.changePage($("#vacio"));
	try	{
		$("#pagina").remove();
	} catch(e) {}
	$("#body").append(html);
	$("#body").trigger("create");
	$.mobile.changePage($("#pagina"));
}

// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////

// mostrar u ocultar "cargando..." jqm
function cargando(mostrar)	{
	if (mostrar)	{
		var interval = setInterval(function(){
			$.mobile.loading('show');
			clearInterval(interval);
		}, 1);
	} else	{
		var interval = setInterval(function(){
			$.mobile.loading('hide');
			clearInterval(interval);
		}, 1);
	}
}

// función genérica símil "toast" de android
var toast = function(msg)	{
	$("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all' style='background-color: #eeeeee;'><h3>"+msg+"</h3></div>")
		.css({ display: "block",
		opacity: 0.90,
		position: "fixed",
		padding: "7px",
		"text-align": "center",
		width: "270px",
		left: ($(window).width() - 284)/2,
		top: $(window).height()/2 })
		.appendTo( $.mobile.pageContainer ).delay( 1500 )
		.fadeOut( 400, function(){
			$(this).remove();
		});
}

// ////////////////////////////////////////////////////////////////////////////

function ejecutarWebService(url, callback)	{
	cargando(true);
	xhr = new XMLHttpRequest();
	xhr.open("GET", url, true); //false);
	xhr.setRequestHeader('Content-Type', 'text/plain');
	xhr.send();
	xhr.onreadystatechange = function() {
		if (xhr.readyState == 4)	{
			cargando(false);
			if (xhr.status == 200) {
				callback(xhr.responseText);
			} else	{
				toast("Problema al conectar al servidor.");
			}
		}
	}
}



// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////


        //*********************************************************************************
        // #region Auxiliary functions 
        //*********************************************************************************
        function formatPEM(pem_string)
        {
            /// <summary>Format string in order to have each line with length equal to 63</summary>
            /// <param name="pem_string" type="String">String to format</param>

            var string_length = pem_string.length;
            var result_string = "";

            for(var i = 0, count = 0; i < string_length; i++, count++)
            {
                if(count > 63)
                {
                    result_string = result_string + "\r\n";
                    count = 0;
                }

                result_string = result_string + pem_string[i];
            }

            return result_string;
        }
        //*********************************************************************************
        function arrayBufferToString(buffer)
        {
            /// <summary>Create a string from ArrayBuffer</summary>
            /// <param name="buffer" type="ArrayBuffer">ArrayBuffer to create a string from</param>

            var result_string = "";
            var view = new Uint8Array(buffer);

            for(var i = 0; i < view.length; i++)
                result_string = result_string + String.fromCharCode(view[i]);

            return result_string;
        }
        //*********************************************************************************
        function stringToArrayBuffer(str)
        {
            /// <summary>Create an ArrayBuffer from string</summary>
            /// <param name="str" type="String">String to create ArrayBuffer from</param>

            var stringLength = str.length;

            var resultBuffer = new ArrayBuffer(stringLength);
            var resultView = new Uint8Array(resultBuffer);

            for(var i = 0; i < stringLength; i++)
                resultView[i] = str.charCodeAt(i);

            return resultBuffer;
        }
        //*********************************************************************************
        // #endregion 


// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////


        //*********************************************************************************
        // #region Create PKCS#10 
        //*********************************************************************************
        function create_PKCS10(CN)
        {
            // #region Initial variables 
            var sequence = Promise.resolve();

            var pkcs10_simpl = new org.pkijs.simpl.PKCS10();

            var publicKey;
            var privateKey;

            var hash_algorithm;
			// xxx
            /*
			var hash_option = document.getElementById("hash_alg").value;
            switch(hash_option)
            {
                case "alg_SHA1":
                    hash_algorithm = "sha-1";
                    break;
                case "alg_SHA256":
                    hash_algorithm = "sha-256";
                    break;
                case "alg_SHA384":
                    hash_algorithm = "sha-384";
                    break;
                case "alg_SHA512":
                    hash_algorithm = "sha-512";
                    break;
                default:;
            }
			*/
			hash_algorithm = "sha-256";

            var signature_algorithm_name;
			// xxx
			/*
            var sign_option = document.getElementById("sign_alg").value;
            switch(sign_option)
            {
                case "alg_RSA15":
                    signature_algorithm_name = "RSASSA-PKCS1-V1_5";
                    break;
                case "alg_RSA2":
                    signature_algorithm_name = "RSA-PSS";
                    break;
                case "alg_ECDSA":
                    signature_algorithm_name = "ECDSA";
                    break;
                default:;
            }
			*/
			signature_algorithm_name = "RSASSA-PKCS1-V1_5";
			
            // #endregion 

            // #region Get a "crypto" extension 
            var crypto = org.pkijs.getCrypto();
            if(typeof crypto == "undefined")
            {
                alert("No WebCrypto extension found");
                return;
            }
            // #endregion 

            // #region Put a static values 
            pkcs10_simpl.version = 0;
			// xxx
            pkcs10_simpl.subject.types_and_values.push(new org.pkijs.simpl.ATTR_TYPE_AND_VALUE({ type: "2.5.4.6", value: new org.pkijs.asn1.PRINTABLESTRING({ value: "AR" }) }));
            pkcs10_simpl.subject.types_and_values.push(new org.pkijs.simpl.ATTR_TYPE_AND_VALUE({ type: "2.5.4.3", value: new org.pkijs.asn1.UTF8STRING({ value: CN }) }));

            pkcs10_simpl.attributes = new Array();
            // #endregion 

            // #region Create a new key pair 
            sequence = sequence.then(
                function()
                {
                    // #region Get default algorithm parameters for key generation 
                    var algorithm = org.pkijs.getAlgorithmParameters(signature_algorithm_name, "generatekey");
                    if("hash" in algorithm.algorithm)
                        algorithm.algorithm.hash.name = hash_algorithm;
                    // #endregion 

                    return crypto.generateKey(algorithm.algorithm, true, algorithm.usages);
                }
                );
            // #endregion 

            // #region Store new key in an interim variables
            sequence = sequence.then(
                function(keyPair)
                {
                    publicKey = keyPair.publicKey;
                    privateKey = keyPair.privateKey;
					
					// xxx
                    document.getElementById("LLAVE_PUBLICA").value = publicKey;
                    document.getElementById("LLAVE_PRIVADA").value = privateKey;
					
                },
                function(error)
                {
                    alert("Error during key generation: " + error);
                }
                );
            // #endregion 

            // #region Exporting public key into "subjectPublicKeyInfo" value of PKCS#10 
            sequence = sequence.then(
                function()
                {
                    return pkcs10_simpl.subjectPublicKeyInfo.importKey(publicKey);
                }
                );
            // #endregion 

            // #region SubjectKeyIdentifier 
            sequence = sequence.then(
                function(result)
                {
                    return crypto.digest({ name: "SHA-1" }, pkcs10_simpl.subjectPublicKeyInfo.subjectPublicKey.value_block.value_hex);
                }
                ).then(
                function(result)
                {
                    pkcs10_simpl.attributes.push(new org.pkijs.simpl.ATTRIBUTE({
                        type: "1.2.840.113549.1.9.14", // pkcs-9-at-extensionRequest
                        values: [(new org.pkijs.simpl.EXTENSIONS({
                            extensions_array: [
                                new org.pkijs.simpl.EXTENSION({
                                    extnID: "2.5.29.14",
                                    critical: false,
                                    extnValue: (new org.pkijs.asn1.OCTETSTRING({ value_hex: result })).toBER(false)
                                })
                            ]
                        })).toSchema()]
                    }));
                }
                );
            // #endregion 

            // #region Signing final PKCS#10 request 
            sequence = sequence.then(
                function()
                {
                    return pkcs10_simpl.sign(privateKey, hash_algorithm);
                },
                function(error)
                {
                    alert("Error during exporting public key: " + error);
                }
                );
            // #endregion 

            sequence.then(
                function(result)
                {
                    var pkcs10_schema = pkcs10_simpl.toSchema();
                    var pkcs10_encoded = pkcs10_schema.toBER(false);

                    var result_string = "-----BEGIN CERTIFICATE REQUEST-----\r\n";
                    result_string = result_string + formatPEM(window.btoa(arrayBufferToString(pkcs10_encoded)));
                    result_string = result_string + "\r\n-----END CERTIFICATE REQUEST-----\r\n";

					//xxx
                    //document.getElementById("pem-text-block").value = result_string;
                    document.getElementById("CERTIFICADO_LOCAL_CSR").value = result_string;
                },
                function(error)
                {
                    alert("Error signing PKCS#10: " + error);
                }
                );
				
				
			// xxx

            // #region Exporting private key 
            sequence = sequence.then(
                function()
                {
                    return crypto.exportKey("pkcs8", privateKey);
                }
                );
            // #endregion 

            // #region Store exported key on Web page 
            sequence = sequence.then(
                function(result)
                {
                    var private_key_string = String.fromCharCode.apply(null, new Uint8Array(result));

                    var result_string = "";

                    result_string = result_string + "-----BEGIN PRIVATE KEY-----\r\n";
                    result_string = result_string + formatPEM(window.btoa(private_key_string));
                    result_string = result_string + "\r\n-----END PRIVATE KEY-----\r\n";

                    // xxx
					// document.getElementById("pkcs8_key").innerHTML = result_string;
					document.getElementById("LLAVE_PRIVADA").value = result_string;
                    //alert("Private key exported successfully!");
                },
                function(error)
                {
                    alert("Error during exporting of private key: " + error);
                }
                );
            // #endregion				


			// xxx

            // #region Exporting public key 
            sequence = sequence.then(
                function()
                {
                    return crypto.exportKey("spki", publicKey);
                }
                );
            // #endregion 

            // #region Store exported key on Web page 
            sequence = sequence.then(
                function(result)
                {
                    var public_key_string = String.fromCharCode.apply(null, new Uint8Array(result));

                    var result_string = "";

                    result_string = result_string + "-----BEGIN PUBLIC KEY-----\r\n";
                    result_string = result_string + formatPEM(window.btoa(public_key_string));
                    result_string = result_string + "\r\n-----END PUBLIC KEY-----\r\n";

					document.getElementById("LLAVE_PUBLICA").value = result_string;
                },
                function(error)
                {
                    alert("Error during exporting of public key: " + error);
                }
                );
            // #endregion				

			
        }

// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////

        var cmsSignedBuffer = new ArrayBuffer(0); // ArrayBuffer with loaded or created CMS_Signed 
        var trustedCertificates = new Array(); // Array of root certificates from "CA Bundle"

        //*********************************************************************************
        // #region Create CMS_Signed  
        //*********************************************************************************
        //xxx
        //function create_CMS_Signed(buffer)
        function create_CMS_Signed(buffer, privateKey, cert_simpl, callback)
        {
            // #region Initial variables 
            var sequence = Promise.resolve();

            //xxx
            //var cert_simpl = new org.pkijs.simpl.CERT();
            var cms_signed_simpl;

            //xxx
            //var publicKey;
            //var privateKey;

            var hash_algorithm;
            hash_algorithm = "sha-256";

            var signature_algorithm_name;
            signature_algorithm_name = "RSASSA-PKCS1-V1_5";
            // #endregion 

            // #region Get a "crypto" extension 
            var crypto = org.pkijs.getCrypto();
            if(typeof crypto == "undefined")
            {
                alert("No WebCrypto extension found");
                return;
            }
            // #endregion 

            // #region Initialize CMS Signed Data structures and sign it
            sequence = sequence.then(
                function(result)
                {
                    cms_signed_simpl = new org.pkijs.simpl.CMS_SIGNED_DATA({
                        version: 1,
                        encapContentInfo: new org.pkijs.simpl.cms.EncapsulatedContentInfo({
                            eContentType: "1.2.840.113549.1.7.1" // "data" content type
                        }),
                        signerInfos: [
                            new org.pkijs.simpl.CMS_SIGNER_INFO({
                                version: 1,
                                sid: new org.pkijs.simpl.cms.IssuerAndSerialNumber({
                                    issuer: cert_simpl.issuer,
                                    serialNumber: cert_simpl.serialNumber
                                })
                            })
                        ],
                        certificates: [cert_simpl]
                    });

                    //alert('se firma: ' + buffer);
                    buffer2 = stringToArrayBuffer(buffer);
                    //alert('pasado a array: ' + buffer2);

                    var contentInfo = new org.pkijs.simpl.cms.EncapsulatedContentInfo({
                        eContent: new org.pkijs.asn1.OCTETSTRING({ value_hex: buffer2 })
                    });


                    cms_signed_simpl.encapContentInfo.eContent = contentInfo.eContent;

                    return cms_signed_simpl.sign(privateKey, 0, hash_algorithm);
                }
                );
            // #endregion 

            sequence.then(
                function(result)
                {
                    var cms_signed_schema = cms_signed_simpl.toSchema(true);

                    var cms_content_simp = new org.pkijs.simpl.CMS_CONTENT_INFO({
                        contentType: "1.2.840.113549.1.7.2",
                        content: cms_signed_schema
                    });

                    var cms_signed_schema = cms_content_simp.toSchema(true);

                    // #region Make length of some elements in "indefinite form" 
                    cms_signed_schema.len_block.is_indefinite_form = true;

                    var block1 = cms_signed_schema.value_block.value[1];
                    block1.len_block.is_indefinite_form = true;

                    var block2 = block1.value_block.value[0];
                    block2.len_block.is_indefinite_form = true;

                    var block3;
                    block3 = block2.value_block.value[2];
                    block3.len_block.is_indefinite_form = true;
                    block3.value_block.value[1].len_block.is_indefinite_form = true;
                    block3.value_block.value[1].value_block.value[0].len_block.is_indefinite_form = true;

                    cmsSignedBuffer = cms_signed_schema.toBER(false);

                    // #region Convert ArrayBuffer to String 
                    var signed_data_string = "";
                    var view = new Uint8Array(cmsSignedBuffer);

                    for(var i = 0; i < view.length; i++)
                        signed_data_string = signed_data_string + String.fromCharCode(view[i]);
                    // #endregion 

                    
                    var result_string = ''; //document.getElementById("new_signed_data").innerHTML;

                    result_string = result_string + "\r\n-----BEGIN CMS-----\r\n";
                    result_string = result_string + formatPEM(window.btoa(signed_data_string));
                    result_string = result_string + "\r\n-----END CMS-----\r\n\r\n";

                    //document.getElementById("new_signed_data").innerHTML = result_string;
                    //parse_CMS_Signed();
                    //alert("CMS Signed Data created successfully!");
                    callback(result_string);
                },
                function(error)
                {
                    alert("Error during signing of CMS Signed Data: " + error);
                }
                );
			return sequence;
        }
        //*********************************************************************************
        // #endregion 

// ////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////


        //*********************************************************************************
        // #region Parse "CA Bundle" file 
        //*********************************************************************************
        //xxx
        //function parseCAbundle(buffer)
        function parsearCertificados(buffer)
        {
        	//xxx
        	var certificados = new Array();

            // #region Initial variables 
            var base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

            var startChars = "-----BEGIN CERTIFICATE-----";
            var endChars = "-----END CERTIFICATE-----";
            var endLineChars = "\r\n";

            //xxx
            //var view = new Uint8Array(buffer);
            var view = new Uint8Array(stringToArrayBuffer(buffer));

            var waitForStart = false;
            var middleStage = true;
            var waitForEnd = false;
            var waitForEndLine = false;
            var started = false;

            var certBodyEncoded = "";
            // #endregion 

            for(var i = 0; i < view.length; i++)
            {
                if(started === true)
                {
                    if(base64Chars.indexOf(String.fromCharCode(view[i])) !== (-1))
                        certBodyEncoded = certBodyEncoded + String.fromCharCode(view[i]);
                    else
                    {
                        if(String.fromCharCode(view[i]) === '-')
                        {
                            // #region Decoded trustedCertificates 
                            var asn1 = org.pkijs.fromBER(stringToArrayBuffer(window.atob(certBodyEncoded)));
                            try
                            {
                            	//xxx
                                //trustedCertificates.push(new org.pkijs.simpl.CERT({ schema: asn1.result }));
                                certificados.push(new org.pkijs.simpl.CERT({ schema: asn1.result }));
                            }
                            catch(ex)
                            {
                                alert("Wrong certificate format");
                                return;
                            }
                            // #endregion 

                            // #region Set all "flag variables" 
                            certBodyEncoded = "";

                            started = false;
                            waitForEnd = true;
                            // #endregion 
                        }
                    }
                }
                else
                {
                    if(waitForEndLine === true)
                    {
                        if(endLineChars.indexOf(String.fromCharCode(view[i])) === (-1))
                        {
                            waitForEndLine = false;

                            if(waitForEnd === true)
                            {
                                waitForEnd = false;
                                middleStage = true;
                            }
                            else
                            {
                                if(waitForStart === true)
                                {
                                    waitForStart = false;
                                    started = true;

                                    certBodyEncoded = certBodyEncoded + String.fromCharCode(view[i]);
                                }
                                else
                                    middleStage = true;
                            }
                        }
                    }
                    else
                    {
                        if(middleStage === true)
                        {
                            if(String.fromCharCode(view[i]) === "-")
                            {
                                if((i === 0) ||
                                   ((String.fromCharCode(view[i - 1]) === "\r") ||
                                    (String.fromCharCode(view[i - 1]) === "\n")))
                                {
                                    middleStage = false;
                                    waitForStart = true;
                                }
                            }
                        }
                        else
                        {
                            if(waitForStart === true)
                            {
                                if(startChars.indexOf(String.fromCharCode(view[i])) === (-1))
                                    waitForEndLine = true;
                            }
                            else
                            {
                                if(waitForEnd === true)
                                {
                                    if(endChars.indexOf(String.fromCharCode(view[i])) === (-1))
                                        waitForEndLine = true;
                                }
                            }
                        }
                    }
                }
            }
            //xxx
            return certificados;
        }
        //*********************************************************************************
        // #endregion 
        //*********************************************************************************


