var models = require('../server/models/index');
var Moment = require('moment-timezone');
    
    var currentDateTime = Date.now();
    console.log('Refreshing reminders!! for ' + 'bridget.pillai@gmail.com' + 'at ' + currentDateTime);
    
    models.Reminders.findAll({ attributes: ['id', 'status', 'deliverAt', 'timeZone', 'Repeat', 'Expired' , 'lastDeliveredAt'],
    where: {
           $not: [ { Expired : 'Yes' } ]}
          }).then(function(Reminders) {
        if (!Reminders) {
          console.log("Zero Notifications!");
        }
        else {   
         console.log('Found Reminders, refreshing!');
         console.log('** from refresh reminder: currentDateTime = ' + new Date(currentDateTime));      
         Reminders.forEach(function (reminder) {
        var deliverAt = reminder.deliverAt;
        var timeZone = reminder.timeZone;
        var repeat = reminder.Repeat;
        var id = reminder.id;
        var lastDeliveredAt = reminder.lastDeliveredAt ;
        var expired = reminder.Expired;
        var date = new Date(deliverAt);
        var rightNow = new Date(currentDateTime);
        var lastDeliveredAtDate; var actualDeliveryDate;

        if (lastDeliveredAt != 'Never') { lastDeliveredAtDate = new Date(lastDeliveredAt) };

console.log("** from refresh reminder: currentDateTime = " + rightNow + "reminder date=" + date + "Reminder id " + id + 'lastDeliveredAt:' + lastDeliveredAt);

        var newYorkTime = Moment.tz(date, "America/New_York");
        var losAngeles = newYorkTime.clone().tz("America/Los_Angeles");
        var centralAmerica = newYorkTime.clone().tz("America/Chicago");
        var india = newYorkTime.clone().tz("Asia/Kolkata");    
        var actualDeliveryDateNY = Moment.tz(rightNow, "America/New_York");


         if (timeZone == "Eastern") {
            deliverAt = newYorkTime.format();
            actualDeliveryDate = actualDeliveryDateNY.format();
        } ;
         if (timeZone == "Central") {
            deliverAt = centralAmerica.format();
            actualDeliveryDate = actualDeliveryDateNY.clone().tz("America/Chicago").format();
        } ;
         if (timeZone == "Pacific") {
            deliverAt = losAngeles.format();
            actualDeliveryDate = actualDeliveryDateNY.clone().tz("America/Los_Angeles").format(); 
        } ;
         if (timeZone == "IST") {
            deliverAt = india.format();
            actualDeliveryDate = actualDeliveryDateNY.clone().tz("Asia/Kolkata").format();
        } ;


        console.log('actualDeliveryDate: ' + actualDeliveryDate);

         var deliverAtHours = date.getHours();
         var deliverAtMinute = date.getMinutes();
         var deliverAtDate = date.getDate();
         var deliverAtMonth = date.getMonth();

         var nowHours = rightNow.getHours();
         var nowMinutes = rightNow.getMinutes();
         var nowDate = rightNow.getDate();
         var nowMonth = rightNow.getMonth();

         var lastDeliveredAtHours , lastDeliveredAtMinute, lastDeliveredAtDay, lastDeliveredAtMonth;

         if (lastDeliveredAt != 'Never') {
            lastDeliveredAtHours = lastDeliveredAtDate.getHours();
            lastDeliveredAtMinute = lastDeliveredAtDate.getMinutes();
            lastDeliveredAtDay = lastDeliveredAtDate.getDate();
            lastDeliveredAtMonth = lastDeliveredAtDate.getMonth();
         }


console.log('*_*_* getting in to updates repeat=' + repeat + 'lastDeliveredAt=' + lastDeliveredAt);      

if (repeat == 'Yes') {
    if (lastDeliveredAt != 'Never') {  
        
   console.log('This is a repeat reminder thats been sent before' + 'deliverhours:' + deliverAtHours + 'deliverAtMinute:' + deliverAtMinute + 'nowHours:' + nowHours + 'nowMinutes:' + nowMinutes + 'nowDate:' + nowDate + 'lastDeliveredAtDay:' + lastDeliveredAtDay);

    if (deliverAtHours == nowHours && deliverAtMinute <= nowMinutes+15 && nowDate > lastDeliveredAtDay) { 
      models.Reminders.update (
                { 
                        Repeat : 'Yes',
                        lastDeliveredAt : actualDeliveryDate,
                        
                },
                    { where: {id: id}}         
                ).then(function(affectedRows){
                    console.log('Updated repeat reminder' + affectedRows + ' rows');
                }).catch(function (err){
                console.log('could not update!');
                res.status(500).send('Could not add the reminder, please contact admin ErroCode:' + err.parent.code);   
               });
               }     
             }
    else {
console.log('This is a repeat reminder thats never been sent before' + 'deliverhours:' + deliverAtHours + 'deliverAtMinute:' + deliverAtMinute + 'nowHours' + nowHours + 'nowMinutes' + nowMinutes);
        if (deliverAtHours == nowHours && deliverAtMinute <= nowMinutes+15) { 
            models.Reminders.update (
                        { 
                            Repeat : 'Yes',
                            lastDeliveredAt : actualDeliveryDate 
                         },
                        { where: {id: id}}         
                    ).then(function(affectedRows){
                        console.log('Updated repeat reminder' + affectedRows + ' rows');
                    });
                }    

            } 
        } else {
        console.log('*_*_* This is a one time reminder check if time matches and send..');
        console.log('*_*_* deliverAtHours:' + deliverAtHours + 'now hours:'+ nowHours);
        console.log('*_*_* deliverAtMinute:' + deliverAtMinute + 'now minute:' + nowMinutes);
        console.log('*_*_* deliverAtDate:' + deliverAtDate + 'now date:' + nowDate);
        console.log('*_*_* deliverAtMonth:' + deliverAtMonth + 'now nowMonth:' + nowMonth);

if (deliverAtHours == nowHours && deliverAtMinute == nowMinutes && deliverAtDate == nowDate && deliverAtMonth == nowMonth && expired != 'Yes') { 
                              models.Reminders.update (
                                     { 
                                        Expired: 'Yes',
                                        lastDeliveredAt : actualDeliveryDate
                                      },
                                    { where: {id: id}}         
                                    ).then(function(affectedRows){
                            console.log('Updated one time reminder' + affectedRows + ' rows');
                         });

                     } 

                  }      


            });
  
       }
    });  


    
