const newsAPIKey = '5b6186a62be04ae9bb3a8bfeb2572a5b';
const googleAPIKey = 'AIzaSyDLAmOKZthLWAjy1LeruXRfTtXaQFrbr6E';
const ticketmasterAPIKey = 'GoG04vFo4immj2OMRsYDechobghqGcFw';

function watchForm() {
  $('form').submit(event => {
    event.preventDefault();
    let inputVal = $('input[type="text"]').val();
    mainHandler(inputVal);
    $('main').toggleClass('hidden');
    scrollDown();
    navClicks();
  });
}

function generateCapitalString(inputVal) {
  let inputArray = inputVal.split(' ');
  inputArray = inputArray.map(word => {
    return word.charAt(0).toUpperCase() + word.substr(1);
  });

  inputVal = inputArray.join(' ');
  return inputVal;
}

function mainHandler(inputVal) {
  generateArtistHeader(inputVal);
  searchWiki(inputVal);
  searchTicketMasterAPI(inputVal);
  searchYouTube(inputVal);
  spotifyLinkGenerator(inputVal);
  soundcloudLinkGenerator(inputVal);
  searchNewsAPI(inputVal);
}

function scrollDown() {
  $('html,body').animate(
    {
      scrollTop: $('#main').offset().top
    },
    400
  );
}

function generateArtistHeader(inputVal) {
  $('#header').html(`
    <h1>${inputVal.toUpperCase()}</h1>
  `);
}

function formatQueryParams(params) {
  const queryItems = Object.keys(params).map(
    key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
  );
  return queryItems.join('&');
}

// Wikipedia API

function searchWiki(inputVal) {
  inputVal = generateCapitalString(inputVal);
  const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + inputVal;
  fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new error(response.statusText);
    })
    .then(responseJson => {
      if (responseJson.type === 'disambiguation') {
        inputVal += ' (musician)';
        disambiguationFetch(inputVal);
      }
      if (responseJson.coordinates) {
        inputVal += ' (band)';
        console.log('input val: ', inputVal);
        disambiguationFetch(inputVal);
      }
      displayWikiInfo(responseJson);
    })
    .catch(error => renderHelpPage());
}

function disambiguationFetch(inputVal) {
  const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + inputVal;

  fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new error(response.statusText);
    })
    .then(responseJson => displayWikiInfo(responseJson))
    .catch(error => renderHelpPage());
}

function displayWikiInfo(responseJson) {
  let results = `
  <img src="img/wikipedia.png" alt="wikipedia logo" id="wiki-logo">
  <img src="${responseJson.originalimage.source}">
  <p>${responseJson.extract}</p>
`;

  $('#wiki-flex').html(results);
}

// YouTube API

function searchYouTube(inputVal) {
  const params = {
    part: 'snippet',
    maxResults: 3,
    q: inputVal,
    type: 'video',
    key: googleAPIKey
  };

  const searchYouTubeURL = 'https://www.googleapis.com/youtube/v3/search';
  const queryString = formatQueryParams(params);
  const url = searchYouTubeURL + '?' + queryString;

  fetch(url)
    .then(response => response.json())
    .then(responseJson => displayYouTube(responseJson))
    .catch(error => console.log(error.message));
}

function displayYouTube(responseJson) {
  let results = responseJson['items'].map(element => {
    return `
      <li id="js-youtube-video">
        <img src="${element.snippet.thumbnails.medium.url}">
        <a href="http://youtube.com/watch?v=${
          element.id.videoId
        }" target="_blank"><i class="fab fa-youtube"></i></a>
        <h4>${element.snippet.title}</h4>
      </li>
      `;
  });

  $('#youtube-ul').html(results);
}

// Ticketmaster API

function searchTicketMasterAPI(inputVal) {
  const params = {
    keyword: inputVal,
    size: 5,
    apikey: ticketmasterAPIKey
  };

  const ticketmasterURL = 'https://app.ticketmaster.com/discovery/v2/events';
  const queryString = formatQueryParams(params);
  const url = ticketmasterURL + '?' + queryString;

  fetch(url)
    .then(response => response.json())
    .then(responseJson => 
      {
        displayTicketMaster(responseJson);
        displaySocialLinks(responseJson);
      });
}

function displayTicketMaster(responseJson) {
  let results = responseJson['_embedded'].events.map(element => {
    return `
    <li>
      <h3>${element.name}</h3>
      <img src="${element.images[0].url}">
      <a href="${element.url}">Link to event</a>
      <p>${element._embedded.venues[0].city.name}, ${
      element._embedded.venues[0].country.name
    }</p>
    </li>
    `;
  });

  $('#ticketmaster-ul').html(results);
}

// News API

function searchNewsAPI(inputVal) {
  const params = {
    q: inputVal,
    language: 'en',
    pagesize: 20
  };

  const options = {
    headers: new Headers({
      'X-Api-Key': newsAPIKey
    })
  };

  const searchNewsURL = 'https://newsapi.org/v2/everything';
  const queryString = formatQueryParams(params);
  const url = searchNewsURL + '?' + queryString;

  fetch(url, options)
    .then(response => response.json())
    .then(responseJson => filterNews(responseJson, inputVal))
    .catch(error => console.log(error.message));
}

function filterNews(responseJson, inputVal) {
  let inputArray = inputVal.split(' ');
  inputArray = inputArray.map(word => {
    return word.charAt(0).toUpperCase() + word.substr(1);
  });

  let results = responseJson['articles'].map(element => {
    return element;
  });

  let relevantNews = results.map(article => {
    let wordArray = article['title'].split(' ');
    let filteredArray = wordArray.filter(word => {
      return word === inputArray[0] || word === inputArray[1];
    });
    if (filteredArray.length > 0) {
      return article;
    }
  });

  let finalResults = relevantNews.filter(articles => articles !== undefined);

  displayNews(finalResults);
}

function displayNews(finalResults) {
  let htmlContent = finalResults.map(element => {
    if (element.urlToImage === null) {
      if (element.content === null) {
        return `
        <li>
        <img src="https://d32ogoqmya1dw8.cloudfront.net/images/clean/nbc_news_logo.png" alt="article image">
          <h3>${element.title}</h3>
          <a href="${element.url}" target="_blank">Go to Article</a>
          <p>was null</p>
        </li>
        `;
      }
      return `
        <li>
          <img src="https://d32ogoqmya1dw8.cloudfront.net/images/clean/nbc_news_logo.png" alt="article image">
          <h3>${element.title}</h3>
          <a href="${element.url}" target="_blank">Go to Article</a>
          <p>${element.content}</p>
        </li>
      `;
    }

    if (element.content === null) {
      return `
      <li>
        <img src="${element.urlToImage}" alt="article image">
        <h3>${element.title}</h3>
        <a href="${element.url}" target="_blank">Go to Article</a>
        <p>was null</p>
      </li>
      `;
    }

    return `
    <li>
      <img src="${element.urlToImage}" alt="article image">
      <h3>${element.title}</h3>
      <a href="${element.url}" target="_blank">Go to Article</a>
      <p>${element.content}</p>
    </li>
    `;
  });

  $('#js-news-results').html(htmlContent);
}

function renderHelpPage() {
  const searchTips = `
  <h1>Help Page</h1>
    <h4>Not seeing the results you want? Here are some search tips!</h4>
    <ul>
      <li>Capitalize the first letter of each word in your search. (Ex. Instead of <strong>'dua lipa'</strong>, use <strong>'Dua Lipa'</strong>)</li>
      <li>Add <strong>Musician</strong> or <strong>Band</strong> in parenthesis to the end of your search. (Ex. Instead of <strong>Drake</strong>, use <strong>Drake (musician)</strong>)</li>
      <li>If you're still not seeing results, please search using Wikipedia and paste the precise page name. (Ex. Drake's Wikipedia link is https://en.wikipedia.org/wiki/<strong>Drake_(musician)</strong>)</li>
    </ul>
    `;

  const wikiErrorMessage = `
    <h1>No results for this search</h1>
    <p>Please refer to our <a href="#help-page">Help Tips</a> to improve your results.</p>
  `;

  $('#js-wiki-results').html(wikiErrorMessage);
  $('#help-page').toggleClass('hidden');
  $('#help-page').html(searchTips);
}

// Social Media Links
function displaySocialLinks(responseJson) {
  let target = checkAttractionsArray(responseJson); //confirms that the target has externalLinks
  createSocialArrays(target); //creates and returns two arrays for links and the network names
  let results = combineSocialArrays(networkResults, networkLinks); //combines the two arrays to make HTML, filters out YouTube/Wikipedia and dead links.
  $('#js-links-results').html(results);
}

function checkAttractionsArray(responseJson) {
  let target = responseJson['_embedded'].events[0]['_embedded'].attractions;
  for (let i = 0; i < target.length; i++) {
    if (target[i].externalLinks !== undefined) { //when there are external links,
      target = target[i]; //this is the target
    }
  } 
  return target;
}

function createSocialArrays(target) {
  networkResults = []; //name of the networks
  networkLinks = []; //actual links
  for (let prop in target.externalLinks) { //loop through object keys
    networkResults.push(prop); //pushes every key to array
    networkLinks.push(target.externalLinks[prop][0].url); //pushes every link to array
  }
  return networkResults, networkLinks;
}

function combineSocialArrays(networkResults, networkLinks) {
  let html = [];
  for (let i = 0; i < networkResults.length; i++) {
    if (networkLinks[i] !== undefined 
      && networkResults[i] !== 'youtube' //if all are true, we push this line item to the array 
      && networkResults[i] !== 'wiki') {
      html.push(`
        <li><a href="${networkLinks[i]}" target="_blank">${networkResults[i]}</a></li>
      `)
    }
  }
  html = html.join(''); //join the arrays items together
  return html;
}

function spotifyLinkGenerator(inputVal) {
  let url = 'https://open.spotify.com/search/results/' + inputVal;
  $('#spotify-results').html(
    `<a href="${url}" target="_blank"><i class="fab fa-spotify"></i></a>`
  );
}

function soundcloudLinkGenerator(inputVal) {
  inputVal = inputVal.replace(' ', '');
  let url = 'https://soundcloud.com/' + inputVal;
  $('#soundcloud-results').html(
    `<a href="${url}" target="_blank"><i class="fab fa-soundcloud"></i></a>`
  );
}

// Main Page Event Listeners

function navClicks() {
  $("#wiki-results-nav").on("click mouseover hover", function(event) {
    $("#wiki-results").show();
    $("#youtube-results").hide();
    $("#ticketmaster-results").hide();
    $("#music-links").hide();
    $("#artist-news").hide();
  });

  $("#youtube-results-nav").on("click mouseover hover", function(event) {
    $("#wiki-results").hide();
    $("#youtube-results").show();
    $("#ticketmaster-results").hide();
    $("#music-links").hide();
    $("#artist-news").hide();
  });

  $("#ticketmaster-results-nav").on("click mouseover hover", function(event) {
    $("#wiki-results").hide();
    $("#youtube-results").hide();
    $("#ticketmaster-results").show();
    $("#music-links").hide();
    $("#artist-news").hide();
  });

  $("#music-links-nav").on("click mouseover hover", function(event) {
    $("#wiki-results").hide();
    $("#youtube-results").hide();
    $("#ticketmaster-results").hide();
    $("#music-links").show();
    $("#artist-news").hide();
  });

  $("#artist-news-nav").on("click mouseover hover", function(event) {
    $("#wiki-results").hide();
    $("#youtube-results").hide();
    $("#ticketmaster-results").hide();
    $("#music-links").hide();
    $("#artist-news").show();
  });
}


$(watchForm);