var config = require('./config'); 
var Bot = require('node-telegram-bot-api');
var bot;

if(process.env.NODE_ENV === 'production') {
  bot = new Bot(config.TelegramToken);
  bot.setWebHook(config.TelegramProductionURL + bot.token);
}
else {
  bot = new Bot(config.TelegramToken, { polling: true });
}

console.log('secon-bot server started...');

var url = "https://spreadsheets.google.com/feeds/list/" + config.googleSheetKey + "/od6/public/values?alt=json";

bot.onText(/(.+)$/, function (msg, match){

  var keywords = match[1];
  var request = require("request");

    request(url, function (error, response, body) {
        if (error || response.statusCode != 200) {
            console.log('Error: '+error); // Show the error
            console.log('Status code: ' + response.statusCode); // Show the error
            return;
        }
        
        var parsed = JSON.parse(body);

        var targetTime = NaN;

        if (!isNaN(keywords))   // isNaN returns false if the value is number
        {
            try{
                targetTime = parseInt(keywords, 10);
            }
            catch(e){
                targetTime = NaN;
            }
        }
        
        if (isNaN(targetTime))
            targetTime = -1;
        
        var formattedAnswer = "";
        var currentAnswer = "";


        var itemsFound = 0;

        parsed.feed.entry.forEach(function(item){
                // get the time(in hours) from the very first column
                var itemTime = NaN;
                var itemTitle = item.title.$t
                try{
                    itemTime = parseInt(itemTitle, 10);
                }
                catch(e)
                {
                    itemTime = NaN;
                }


                if (
                    (isNaN(itemTime) && itemTitle.toLowerCase().trim() == keywords.toLowerCase().trim())
                    )
                {
                    // add the line break if not the first answer
                    if (itemsFound==0) 
                        formattedAnswer += "barang yang anda cari adalah:\n\n";
                    else 
                        formattedAnswer += "\n\n";
                        
                    itemsFound++;
                    formattedAnswer += '\u27a1' + item.content.$t; 
                }
		});


        if (itemsFound == 0)
        {
            if (targetTime<0 || targetTime>24)
                formattedAnswer = "Barang yang anda cari tidak tersedia atau keyword salah.\n\n";
            else 
                formattedAnswer = "Can't find events for the given time ";
                
            // output current answer
            if (currentAnswer != '')
            {
                formattedAnswer += "Paling ngisor";
            }
        }
    
        // send message telegram finally
        bot.sendMessage(msg.chat.id, formattedAnswer).then(function () {
            // reply sent!
        });
    
    });


});







        
