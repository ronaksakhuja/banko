gameID = localStorage["gameID"];
$("#gameid").html(gameID);
myid = localStorage["pid"];
if (myid != 0) {
    $("#startGame").hide();

}

$("#startGame").on("click", function() {
    $("#startGame").hide();
    firebase.database().ref('games/' + gameID).update({
        pot: 0
    });
});
$("#drawcards").on("click", function() {
    deck_id = localStorage["gameID"];

    getPlayerCount(deck_id);
})
$("#shuffle").hide();
$("#shuffle").on("click", function() {
    deck_id = localStorage["gameID"];

    shuffleFirebase(deck_id);
});
$("#bidbutton").on("click", function() {
    //transactions later on
    //checkif bid amount more than pot
    amount = parseInt($("#bidvalue")[0].value);
    pot = localStorage["potvalue"];
    if (amount > pot) {
        alert("Amount cannot be higher than Pot value");
    } else {
        deck_id = localStorage["gameID"];
        //withdraw card to check win or not
        $.getJSON("https://deckofcardsapi.com/api/deck/" + deck_id + "/draw/?count=1", function(data) {
            firebase.database().ref('games/' + gameID).update({
                checkercard: data
            });
            setTimeout(function() {

                // Something you want delayed.
                cardVal = data["cards"][0].value;
                console.log("withdrawn card is" + cardVal);
                pid = localStorage["pid"];
                cardVal = convertFaceCards(cardVal);

                res = checkInBetween(cardVal, pid, amount);
                changePotMoney(res, pid, deck_id, amount);
                nextTurnFirebase(deck_id);

            }, 1000);


        });
    }


});
$("#bankobutton").on("click", function() {
    $("#bidvalue").attr("value", localStorage["potvalue"]);
    $("#bidbutton").click();
});
$("#passbutton").on("click", function() {
    $("#bidvalue").attr("value", 0);
    $("#bidbutton").click();
});

function convertFaceCards(cardVal) {
    if (cardVal == "KING") {
        cardVal = "13";
    } else if (cardVal == "QUEEN") {
        cardVal = "12";
    } else if (cardVal == "ACE") {
        cardVal = "1";
    } else if (cardVal == "JACK") {
        cardVal = "11";
    }
    return cardVal;
}
var gamestarted = firebase.database().ref('games/' + gameID + '/has_started');
gamestarted.on('value', function(snapshot) {
    start = snapshot.val();
    if (start == 0) {
        localStorage.setItem("game_start", "0");
    } else
        localStorage.setItem("game_start", "1");

});

var checkercard = firebase.database().ref('games/' + gameID + '/checkercard');
checkercard.on('value', function(snapshot) {
    img_url = snapshot.val()["cards"][0].image;
    $("#new_card").html("<img src='" + img_url + "' height=200%>")

});

function getPlayerCount(gameID, cardid) {
    return firebase.database().ref('/games/' + gameID).once('value').then(function(snapshot) {
        deck_id = gameID
        players = snapshot.val()["players"].count;
        $.get("https://deckofcardsapi.com/api/deck/" + deck_id + "/draw/?count=" + players, function(data) {
            cardnumber = snapshot.val().cardsdrawn;
            if (cardnumber == 0) {


                for (var i = 0; i < players; i++) {
                    firebase.database().ref('games/' + gameID + "/players/" + i).update({
                        card0: data.cards[i]
                    });
                }
                firebase.database().ref('games/' + gameID).update({
                    cardsdrawn: 1
                });
            } else {
                for (var i = 0; i < players; i++) {
                    firebase.database().ref('games/' + gameID + "/players/" + i).update({
                        card1: data.cards[i]
                    });
                }
                firebase.database().ref('games/' + gameID).update({
                    cardsdrawn: 0
                });
            }
        });
    });
}

var player = firebase.database().ref('games/' + gameID + '/players');
player.on('value', function(snapshot) {
    if (snapshot.val() != undefined) {
        localStorage.setItem("player_data", JSON.stringify(snapshot.val()));
        if (snapshot.val()[0].card0 == "null") {
            $("#new_card").html("");
        }
        updateTableWinnings();
        count_players = snapshot.val().count;
        player_names = "";
        card0 = "";
        card1 = "";
        for (var i = 0; i < count_players; i++) {
            player_names += "<td><center>" + snapshot.val()[i].name + "</center></td>";
            card0 += "<td><img src='" + snapshot.val()[i].card0.image + "' height=50%></td>";
            card1 += "<td><img src='" + snapshot.val()[i].card1.image + "' height=50%></td>";
        }
        $("#player_names").html(player_names);
        $("#card0").html(card0);
        $("#card1").html(card1);
        console.log(snapshot.val());
    }
});

function updateTableWinnings() {
    object = JSON.parse(localStorage["player_data"]);
    str = ""
    for (var i = 0; i < object.count; i++) {
        str += "<tr><td>" + object[i].name + "</td>" + "<td>" + object[i].net + "</td></tr>";
    }
    $("#winnings").html(str);
}
var turn = firebase.database().ref('games/' + gameID + '/turn');
turn.on('value', function(snapshot) {
    turnid = snapshot.val();
    console.log(turnid);
    $("#turn_name").html(JSON.parse(localStorage["player_data"])[turnid].name);

    myid = localStorage["pid"];
    if (myid == turnid) {
        $("#bidbutton").attr("disabled", false)
        $("#bankobutton").attr("disabled", false)
        $("#passbutton").attr("disabled", false)

    } else {
        $("#bidbutton").attr("disabled", true)
        $("#bankobutton").attr("disabled", true)
        $("#passbutton").attr("disabled", true)
    }

});

var potval = firebase.database().ref('games/' + gameID + '/pot');
potval.on('value', function(snapshot) {
    $("#potvalue").html(snapshot.val());
    localStorage.setItem("potvalue", parseInt(snapshot.val()));
    if (localStorage["pid"] == "0") {

        if (snapshot.val() == 0) {
            //pot is 0, everyone pitches in money
            console.log("Withdrawing Boot Value");

            withdrawBoot(gameID);
        }
    }

});
var updatestring = firebase.database().ref('games/' + gameID + '/lastupdate');
updatestring.on('value', function(snapshot) {
    $("#updateWinner").html(snapshot.val());

});

function shuffleFirebase(gameID) {
    return firebase.database().ref('/games/' + gameID).once('value').then(function(snapshot) {
        deck_id = gameID
        players = snapshot.val()["players"].count;
        for (var i = 0; i < players; i++) {
            firebase.database().ref('games/' + gameID + "/players/" + i).update({
                card0: "null",
                card1: "null"
            });
        }
        $.get("https://deckofcardsapi.com/api/deck/" + deck_id + "/shuffle", function(data) {

        });
    });
}

function withdrawBoot(gameID) {
    return firebase.database().ref('/games/' + gameID).once('value').then(function(snapshot) {
        deck_id = gameID
        players = snapshot.val()["players"].count;
        potadd = 0;
        for (var i = 0; i < players; i++) {
            potadd += 50;
            netamount = snapshot.val()["players"][i].net;
            firebase.database().ref('games/' + gameID + "/players/" + i).update({
                net: netamount - 50
            });
        }
        firebase.database().ref('games/' + gameID).update({
            pot: potadd
        });
    });
}

function nextTurnFirebase(gameID) {
    return firebase.database().ref('/games/' + gameID + "/").once('value').then(function(snapshot) {
        deck_id = gameID
        console.log(snapshot.val());
        players = snapshot.val()["players"].count;
        turn = (snapshot.val().turn + 1) % players;
        firstturn = snapshot.val().firstturn;
        console.log("NTF : new turn " + turn + " firstturn " + firstturn);

        if (turn == firstturn) {
            setTimeout(function() {

                $("#shuffle").click();
                firstturn = (firstturn + 1) % players;
                firebase.database().ref('games/' + gameID).update({
                    firstturn: firstturn,
                    turn: firstturn
                });
                $("#new_card").html("");
                alert("Next Round! Draw Cards");
            }, 1000);
            //round is over

            //update first turn++ and turn =firstturn
            //shuffle the deck


        } else {
            firebase.database().ref('games/' + gameID).update({
                turn: turn
            });
        }
    });
}

function checkInBetween(cardval, i) {
    card0val = convertFaceCards(JSON.parse(localStorage["player_data"])[i].card0.value);
    card1val = convertFaceCards(JSON.parse(localStorage["player_data"])[i].card1.value);
    lower = Math.min(parseInt(card0val), parseInt(card1val));
    higher = Math.max(parseInt(card0val), parseInt(card1val));
    cardval = parseInt(cardval);
    console.log(lower + " ; " + higher + " ; " + cardval);
    if (cardval > lower && cardval < higher) {
        console.log("vic");
        $("#transaction_text").append(JSON.parse(localStorage["player_data"])[i].name + " won " + amount);
        return 1;
        //case victory
    } else if (cardval == lower || cardval == higher) {
        $("#transaction_text").append(JSON.parse(localStorage["player_data"])[i].name + " lost " + 2 * amount);
        return 2;
        //case double loss
    } else {
        $("#transaction_text").append(JSON.parse(localStorage["player_data"])[i].name + " lost " + amount);

        return 0;
    } //case loss
}

function changePotMoney(res, pid, deck_id, amount) {
    console.log("RESULT : " + res);
    return firebase.database().ref('/games/' + gameID).once('value').then(function(snapshot) {
        deck_id = gameID
        players = snapshot.val()["players"].count;
        potadd = 0;

        if (res == 0) {
            //player lost amount
            var audio = new Audio('audio/loosing.mp3');
            audio.play();
            player_amount = parseInt(snapshot.val()["players"][pid].net) - amount;
            firebase.database().ref('games/' + gameID + "/players/" + pid).update({
                net: player_amount
            });
            potadd = amount;
            updateStr = snapshot.val()["players"][pid].name + " lost " + amount;
            firebase.database().ref('games/' + gameID).update({
                lastupdate: updateStr
            });

        }
        if (res == 1) {
            //player wins
            var audio = new Audio('audio/winning.mp3');
            audio.play();
            player_amount = parseInt(snapshot.val()["players"][pid].net) + amount;
            firebase.database().ref('games/' + gameID + "/players/" + pid).update({
                net: player_amount
            });
            potadd = -1 * amount;
            updateStr = snapshot.val()["players"][pid].name + " won " + amount;
            firebase.database().ref('games/' + gameID).update({
                lastupdate: updateStr
            });
            $("#updateWinner").html();

        }
        if (res == 2) {
            // double loss for player
            var audio = new Audio('audio/loosing.mp3');
            audio.play();
            player_amount = parseInt(snapshot.val()["players"][pid].net) - amount - amount;
            firebase.database().ref('games/' + gameID + "/players/" + pid).update({
                net: player_amount
            });
            potadd = amount * 2;
            updateStr = snapshot.val()["players"][pid].name + " MEGA LOST " + 2 * amount;
            firebase.database().ref('games/' + gameID).update({
                lastupdate: updateStr
            });

        }
        newpot = snapshot.val().pot + potadd;
        if (newpot == 0) {

            turn = snapshot.val().turn;
            firstturn = snapshot.val().firstturn;
            newturn = (firstturn + 1) % players;
            console.log("CPM : new turn " + turn + " firstturn " + firstturn);
            setTimeout(function() {

                firebase.database().ref('games/' + gameID).update({
                    turn: newturn,
                    firstturn: newturn
                });
                // end the round
                for (var i = 0; i < players; i++) {
                    firebase.database().ref('games/' + gameID + "/players/" + i).update({
                        card0: "null",
                        card1: "null"
                    });
                }
                alert("Next round! Draw Cards");
            }, 1000);

            //changing turn to first turn-1 so that it can trigger change of new firstturn

        }
        firebase.database().ref('games/' + gameID).update({
            pot: newpot
        });
    });
}


function mod(n, m) {
    return ((n % m) + m) % m;
}