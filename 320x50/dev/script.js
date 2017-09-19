// HTML5 Ad Template JS from DoubleClick by Google

var logoExit;
var erTimeDisplay;
var erWaitTime;
var erFeedTitle;


//Function to run with any animations starting on load, or bringing in images etc
bannerInit = function() {

  logoExit = document.getElementById('logo');
  erTimeDisplay = document.getElementById('timedisplay');
  erWaitTime = document.getElementById('waittime');
  erWaitPubDateTime = document.getElementById('pubdatetime');
  erFeedTitle = erTimeDisplay.getAttribute("data-ertitle");

  //addListeners();

  //anim();

  setInterval(function() {
    fetchWaitTimes();
  }, 300000);

  fetchWaitTimes();
}

formatDateTime = function(dateTimeText){
  var dateTimeArray;
  var timeArray;
  var timeZone;
  var hours;
  var meridiem = 'am';
  
  dateTimeArray =  dateTimeText.split(' ');
  timeZone =  dateTimeArray[dateTimeArray.length-1];
  timeArray = dateTimeArray[dateTimeArray.length-2].split(':');  
  hours = parseInt(timeArray[0] );
  if (hours >= 12){    
    meridiem = 'pm';
    if (hours > 12){
      hours -= 12;
    }
  }
  return hours + ':' + timeArray[1] + meridiem + ' ' + timeZone;
} 

processFeedData = function(responseText) {
  try {
    var erWaitTimeMessage;
    var erFeed = JSON.parse(responseText);
    var items = erFeed.rss.channel.item;
    var length = items.length;
    var waitTime = '';

    if (length > 0) {
      erWaitTimeMessage = 'No matching item.';
    } else {
      erWaitTimeMessage = 'Empty feed';
    }

    for (i = 0; i < length; i++) {

      if (items[i].title === erFeedTitle) {
        waitTime = items[i].description.split(' ')[0];
        if (waitTime.length == 1) {
          waitTime = '0' + waitTime;
        }
        erWaitTime.innerHTML = waitTime;        
        erWaitPubDateTime.innerHTML = formatDateTime(items[i].pubDate);
        erTimeDisplay.className = 'time-display';
        erWaitTimeMessage = 'ER Wait Time has been updated.';
      }
    }

    console.log(erWaitTimeMessage);
  } catch (e) {
    console.log('Invalid JSON.');
  }
}

fetchWaitTimes = function() {
  var xhr;

  console.log('Fetching ER Wait Times.');

  if (window.XDomainRequest) {
    //IE9,IE10
    xhr = new XDomainRequest();
    xhr.open("GET", erFeedURL);
  } else if (window.XMLHttpRequest) {
    xhr = new XMLHttpRequest();
    xhr.open("GET", erFeedURL, true);
  }

  xhr.onload = function() {
    var items;
    var length;
    var i;

    if (xhr.status)
      //XMLHTTPRequest
      if (xhr.status === 200) {
        processFeedData(xhr.responseText);
      } else {
        console.log('Request failed.  Returned status of ' + xhr.status);
      }
    else {
      //XDomainRequest
      processFeedData(xhr.responseText);
    }

  };

  xhr.send();

  xhr.onerror = function() {
    console.log("Feed error.")
  };
}

anim = function() {
  console.log('Banner animation has begun.');  
}

//Add Event Listeners for DoubleClick
addListeners = function() {
  logoExit.addEventListener('click', logoExitHandler, false);
}

logoExitHandler = function(e) {
  //Call Exits
  console.log("Logo clicked.");
  Enabler.exit('HTML5_Logo_Clickthrough');
}
