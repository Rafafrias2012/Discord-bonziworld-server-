let socket;
let users = {};
let self = {};

function $(id) {
    return document.getElementById(id)
};

function linkify(msg) {
    //Don't linkify HTML messages
    if (msg.includes("<")) return msg;

    msg = msg.split(" ");
    let nmsg = [];
    msg.forEach(word => {
        if (word.startsWith("http://") || word.startsWith("https://")) {
            nmsg.push("<a href='" + word + "' target='_blank'>" + word + "</a>")
        } else nmsg.push(word);
    })
    return nmsg.join(" ");
}

function login() {
    if ($("error").style.display != "none") {
        $("error").style.display = "none";
        $("input_wrapper").style.display = "block";
        return;
    }
    $("input_wrapper").style.display = "none";
    $("loading").style.display = "inline-block";
    self = {
        name: $("login_nickname").value,
        room: $("login_room").value,
        color: ""
    };
    socket.emit("login", self);
}

function send() {
    let tosend = $("send_message").value;
    if (tosend.startsWith("/")) {
        comd = tosend.split(" ")[0].replace("/", '');
        param = tosend.includes(" ") ? tosend.substring(tosend.indexOf(" ") + 1, tosend.length) : "";
        socket.emit("command", {
            command: comd,
            param: param
        });
    } else socket.emit("talk", $("send_message").value);
    $("send_message").value = "";
}

function sidebaropen() {
    $("sidebar").style.display = "block";
    $("chatbox").style.width = "calc(100% - " + (innerWidth > 600 ? "300px" : "50%") + ")";
}

function sidebarclose() {
    $("sidebar").style.display = "none";
    $("chatbox").style.width = "100%";
}

function makeMessage(userdata, text) {
    speak.play(
                            text, {
                                pitch: 150,
                                speed: 150
                            },
      );
    text = linkify(text);
    let toscroll = $("chatbox").scrollHeight - $("chatbox").scrollTop < $("chatbox").offsetHeight + 20;
    if (userdata) $("chatbox").insertAdjacentHTML("beforeend", `<p class="message"><span style="color: ${userdata.color};">${userdata.name+":</span> "+text}</p>`);
    else $("chatbox").insertAdjacentHTML("beforeend", `<p class="message">${text}</p>`);
    if (toscroll) $("chatbox").scrollTop = $("chatbox").scrollHeight;
}

window.onload = () => {
    $("send_message").onkeydown = key => {
        if (key.which == 13) send();
    }
    if (innerWidth > 600) sidebaropen();

    //CONNECT
    socket = io("https://bonziworld.org");
    delete io;

    //SET UP LISTENERS
    socket.on("login", logindata => {
        $("login").style.display = "none";
        $("content").style.display = "block";
        users = logindata.users;
        $("user_count").innerHTML = Object.keys(users).length + " " + (Object.keys(users).length == 1 ? "User" : "Users");
        $("sidebar_content").innerHTML = '';
        Object.keys(users).forEach(key => {
            let user = users[key];
            $("sidebar_content").insertAdjacentHTML("beforeend", `<p style="color:${user.color};" id="${user.guid}l">${user.name}</p>`);
        })
    })

    socket.on("update", user => {
        users[user.guid] = user;
        $(user.guid + "l").innerHTML = user.name;
        $(user.guid + "l").style.color = user.color;
    })

    socket.on("join", user => {
        var a = new Audio("https://ia803401.us.archive.org/34/items/intro-2_202405/0018.wav");
            a.play();
        users[user.guid] = user;
        $("user_count").innerHTML = Object.keys(users).length + " " + (Object.keys(users).length == 1 ? "User" : "Users");
        makeMessage(null, user.name + " has joined!");
        $("sidebar_content").insertAdjacentHTML("beforeend", `<p style="color:${user.color};" id="${user.guid}l">${user.name}</p>`);
    })

    socket.on("leave", guid => {
        var a = new Audio("https://ia803401.us.archive.org/34/items/intro-2_202405/0019.wav");
            a.play();
        makeMessage(null, users[guid].name + " has left!");
        $(guid + "l").remove();
        delete users[guid];
        $("user_count").innerHTML = Object.keys(users).length + " " + (Object.keys(users).length == 1 ? "User" : "Users");
    })

    socket.on("talk", text => {
        makeMessage(users[text.guid], text.text);
    })

    socket.on("error", error => {
        $("login_error").innerHTML = error;
        $("error").style.display = "block";
        $("loading").style.display = "none";
    })

    socket.on("disconnect", () => {
        makeMessage(null, "<font color='red'>DISCONNECTED! RECONNECTING...</font>");
    })
    socket.io.on("reconnect", () => {
        makeMessage(null, "<font color='red'>RECONNECTED SUCCESSFULLY!</font>");
        socket.emit("login", self);
    })
          }
