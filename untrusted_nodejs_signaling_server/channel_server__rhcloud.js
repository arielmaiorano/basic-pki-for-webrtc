// ////////////////////////////////////////////////////////////////////////////

var fs = require("fs");
var http = require("http");
var path = require("path");

var sessions = {};
var usersInSessionLimit = 10;

// OPENSHIFT_NODEJS_*
ipaddress = process.env.OPENSHIFT_NODEJS_IP;
port = process.env.OPENSHIFT_NODEJS_PORT || 8080;


var serverDir = path.dirname(__filename)
var clientDir = path.join(serverDir, "client/");

var contentTypeMap = {
    ".html": "text/html;charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css"
};

var server = http.createServer(function (request, response) {
    var headers = {
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache",
        "Expires": "0"
    };
	// xxx
	headers["Access-Control-Allow-Origin"] = "*";
	headers["Access-Control-Allow-Credentials"] = "true";
	headers["Access-Control-Allow-Methods"] = "OPTIONS, GET, POST";
	headers["Access-Control-Allow-Headers"] = "Content-Type, Depth, User-Agent, X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control";

    var parts = request.url.split("/");

    // handle "client to server" and "server to client"
    if (parts[1] == "ctos" || parts[1] == "stoc" || parts[1] == "list") {
        var sessionId = parts[2];
        var userId = parts[3];
        if ((!sessionId || !userId) && parts[1] != "list") {
            response.writeHead(400, headers);
            response.end();
            return;
        }

        if (parts[1] == "stoc") {
            console.log("@" + sessionId + " - " + userId + " joined.");

            headers["Content-Type"] = "text/event-stream";
            response.writeHead(200, headers);
            function keepAlive(resp) {
                resp.write(":\n");
                resp.keepAliveTimer = setTimeout(arguments.callee, 30000, resp);
            }
            keepAlive(response);  // flush headers + keep-alive

            var session = sessions[sessionId];
            if (!session)
                session = sessions[sessionId] = {"users" : {}};

            if (Object.keys(session.users).length > usersInSessionLimit - 1) {
                console.log("user limit for session reached (" + usersInSessionLimit + ")");
                response.write("event:busy\ndata:" + sessionId + "\n\n");
                clearTimeout(response.keepAliveTimer);
                response.end();
                return;
            }

            var user = session.users[userId];
            if (!user) {
                user = session.users[userId] = {};
                for (var pname in session.users) {
                    var esResp = session.users[pname].esResponse;
                    if (esResp) {
                        clearTimeout(esResp.keepAliveTimer);
                        keepAlive(esResp);
                        esResp.write("event:join\ndata:" + userId + "\n\n");
                        response.write("event:join\ndata:" + pname + "\n\n");
                    }
                }
            }
            else if (user.esResponse) {
                user.esResponse.end();
                clearTimeout(user.esResponse.keepAliveTimer);
                user.esResponse = null;
            }
            user.esResponse = response;

            request.on("close", function () {
                for (var pname in session.users) {
                    if (pname == userId)
                        continue;
                    var esResp = session.users[pname].esResponse;
                    esResp.write("event:leave\ndata:" + userId + "\n\n");
                }
                delete session.users[userId];
                clearTimeout(response.keepAliveTimer);
                console.log("@" + sessionId + " - " + userId + " left.");
                console.log("users in session " + sessionId + ": " + Object.keys(session.users).length);
                //xxx
                if (Object.keys(session.users).length == 0) {
                    delete sessions[sessionId];
                }
            });

        //xxx
        //} else { // parts[1] == "ctos"
		} else if (parts[1] == "ctos")	{

            var peerId = parts[4];
            var peer;
            var session = sessions[sessionId];
            if (!session || !(peer = session.users[peerId])) {
                response.writeHead(400, headers);
                response.end();
                return;
            }

            var body = "";
            request.on("data", function (data) { body += data; });
            request.on("end", function () {
                console.log("@" + sessionId + " - " + userId + " => " + peerId + " :");
                // xxx
                // console.log(body);
                var evtdata = "data:" + body.replace(/\n/g, "\ndata:") + "\n";
                peer.esResponse.write("event:user-" + userId + "\n" + evtdata + "\n");
            });

            // to avoid "no element found" warning in Firefox (bug 521301)
            headers["Content-Type"] = "text/plain";
            response.writeHead(204, headers);
            response.end();
		
		// xxx
		} else if (parts[1] == "list")	{
            //headers["Content-Type"] = "application/json";
            response.writeHead(200, headers);
            //var json = '{"sessions": [ {"id": "123", "users": ["u1", "u2", "u3"]}, {"id": "456", "users": ["u21", "u22", "u23"]} ] }';
            var json = '{"sessions": [  ';
            for (var ii in sessions) {
                json += '{"id": "'+ ii +'", "users": [  ';
                for (var jj in sessions[ii].users) {
                    json += '"'+ jj +'", ';
                }
                json = json.slice(0,-2);
                json += ' ] }, ';
            }
            json = json.slice(0,-2);
            json += ' ] }';
			response.write(json);
            response.end();
		}
		
		return;
    }

    var url = request.url.split("?", 1)[0];
    var filePath = path.join(clientDir, url);
    if (filePath.indexOf(clientDir) != 0 || filePath == clientDir)
        filePath = path.join(clientDir, "/index.html");

    fs.stat(filePath, function (err, stats) {
        if (err || !stats.isFile()) {
            response.writeHead(404);
            response.end("404 Not found");
            return;
        }

        var contentType = contentTypeMap[path.extname(filePath)] || "text/plain";
		// xxx
        //response.writeHead(200, { "Content-Type": contentType });
		headers["Content-Type"] = contentType;
        response.writeHead(200, headers);

        var readStream = fs.createReadStream(filePath);
        readStream.on("error", function () {
            response.writeHead(500);
            response.end("500 Server error");
        });
        readStream.pipe(response);
    });
});

console.log('The server is listening on port ' + port);

//xxx
//server.listen(port);
server.listen(port, ipaddress);
