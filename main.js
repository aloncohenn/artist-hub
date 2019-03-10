const newsAPIKey = '5b6186a62be04ae9bb3a8bfeb2572a5b';
const googleAPIKey = 'AIzaSyAWP2A6DGhGCUR15wfo2Y8HP0ij5mSIllA';
const ticketmasterAPIKey = 'GoG04vFo4immj2OMRsYDechobghqGcFw';

function watchForm() {
  $('form').submit(event => {
    event.preventDefault();
    let inputVal = $('input[type="text"]').val();
    mainHandler(inputVal);
    $('main').removeClass('hidden');
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
  searchNewsAPI(inputVal);
  scrollTop();
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
  $('#artist-header').html(`
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
        disambiguationFetch(inputVal);
      }
      displayWikiInfo(responseJson, inputVal);
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
    .then(responseJson => displayWikiInfo(responseJson, inputVal))
    .catch(error => renderHelpPage());
}

function displayWikiInfo(responseJson, inputVal) {
  let results = `
  <img src="img/wikipedia.png" alt="wikipedia logo" id="wiki-logo">
  <div id="js-wiki-flex">
    <img src="${
      responseJson.originalimage.source
    }" alt="image of ${inputVal}" id="bio-image">
    <p>${responseJson.extract}</p>
  </div>
`;

  $('#wiki-results').html(results);
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
    .then(responseJson => {
      if (responseJson['items'].length === 0) {
        renderYouTubeError();
      } else {
        displayYouTube(responseJson);
      }
    })
    .catch(error => renderYouTubeError());
}

function displayYouTube(responseJson) {
  let results = responseJson['items'].map(element => {
    return `
      <li id="js-youtube-video">
        <img src="${element.snippet.thumbnails.medium.url}" class="flex-image">
        <br>
        <a href="http://youtube.com/watch?v=${
          element.id.videoId
        }" target="_blank" id="youtube-play-button"><i class="fab fa-youtube"></i></a>
        <h4>${element.snippet.title}</h4>
      </li>
      `;
  });

  $('#youtube-flex').html(results);
}

function renderYouTubeError() {
  const youTubeErrorMessage = `
    <h1>No videos for this search</h1>
    <p>Unfortunately, there are no videos associated with your search.</p>
  `;

  $('#youtube-flex').html(youTubeErrorMessage);
}

// Ticketmaster API

function searchTicketMasterAPI(inputVal) {
  const params = {
    keyword: inputVal,
    size: 6,
    apikey: ticketmasterAPIKey
  };

  const ticketmasterURL = 'https://app.ticketmaster.com/discovery/v2/events';
  const queryString = formatQueryParams(params);
  const url = ticketmasterURL + '?' + queryString;

  fetch(url)
    .then(response => response.json())
    .then(responseJson => {
      if (responseJson['_embedded'] === undefined) {
        throw new error(response.statusText);
      } else {
        displayTicketMaster(responseJson);
        displaySocialLinks(responseJson, inputVal);
      }
    })
    .catch(error => {
      renderTicketmasterError();
      renderSocialLinksError();
    });
}

function displayTicketMaster(responseJson) {
  let results = responseJson['_embedded'].events.map(element => {
    return `
    <li>
      <h2>${element.name}</h2>
      <img src="${element.images[0].url}" alt="event image" class="flex-image">
      <br>
      <a href="${element.url}">Event</a>
      <p>${element._embedded.venues[0].city.name}, ${
      element._embedded.venues[0].country.name
    }</p>
    </li>
    `;
  });

  $('#ticketmaster-flex').html(results);
}

function renderTicketmasterError() {
  const ticketmasterErrorMessage = `
    <h1>No shows for this search</h1>
    <p>Unfortunately, there are no upcoming shows.</p>
  `;

  $('#ticketmaster-flex').html(ticketmasterErrorMessage);
}

function renderSocialLinksError(inputVal) {
  const socialLinksError = `
    <h1>No artist for this search</h1>
    <p>Unfortunately, there are no profiles associated with your search.</p>
    <li><a href="https://open.spotify.com/search/results/${inputVal}" target="_blank">Spotify Search</a></li>
    <li><a href="https://soundcloud.com/search?q=${inputVal}" target="_blank">Soundcloud Search</a></li>`;

  $('#js-links-results').html(socialLinksError);
}

// News API

function searchNewsAPI(inputVal) {
  const params = {
    q: inputVal,
    language: 'en',
    pagesize: 10
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
    .then(responseJson => {
      if (responseJson['totalResults'] === 0) {
        renderNewsError();
        throw new error(response.statusText);
      } else {
        filterNews(responseJson, inputVal);
      }
    })
    .catch(error => renderNewsError());
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
      return `
        <li>
          <img src="https://d32ogoqmya1dw8.cloudfront.net/images/clean/nbc_news_logo.png" alt="article image" class="flex-image">
          <h3>${element.title}</h3>
          <a href="${element.url}" target="_blank">Go to Article</a>
        </li>
      `;
    }

    return `
    <li>
      <h3>${element.title}</h3>
      <img src="${element.urlToImage}" alt="article image" class="flex-image">
      <a href="${element.url}" target="_blank">Article</a>
    </li>
    `;
  });

  if (htmlContent.length === 0) {
    renderNewsError();
  }

  $('#news-flex').html(htmlContent);
}

function renderNewsError() {
  const newsError = `
    <h1>No news articles available for this search</h1>
    <p>Unfortunately, there are no recent articles available for your search.</p>
    `;

  $('#news-flex').html(newsError);
}

// function trimTitle(finalResults) {
//   let cloneArray = JSON.parse(JSON.stringify(finalResults));
//   let titleArray = cloneArray.map(element => element['title'].split(' '));
//   for (let i = 0; i < titleArray.length; i++) {
//     if (titleArray.length > 8) {
//       titleArray = titleArray.slice(0, 8);
//       titleArray = titleArray.join('') + '...';
//     }
//   }
//   console.log('titlearray', titleArray);
//   return titleArray;
// }

function renderHelpPage() {
  const wikiErrorMessage = `
    <h1>No results for this search</h1>
    <p>Please refer to our <a href="#help-page">Help Tips</a> to improve your results.</p>
  `;

  $('#wiki-flex').html(wikiErrorMessage);
}

// Social Media Links
function displaySocialLinks(responseJson, inputVal) {
  let target = checkAttractionsArray(responseJson, inputVal); //confirms that the target has externalLinks and is the artist name
  createSocialArrays(target); //creates and returns two arrays for links and the network names
  let results = combineSocialArrays(networkResults, networkLinks, inputVal); //combines the two arrays to make HTML, filters out YouTube/Wikipedia and dead links.
  $('#js-links-results').html(results);
}

function checkAttractionsArray(responseJson, inputVal) {
  let target = responseJson['_embedded'].events[0]['_embedded'].attractions;
  let inputArray = inputVal.split(' ');
  inputArray = inputArray.map(word => {
    return word.charAt(0).toUpperCase() + word.substr(1);
  });
  let inputName = inputArray.join(' ');
  for (let i = 0; i < target.length; i++) {
    if (target[i].externalLinks !== undefined && target[i].name === inputName) {
      //when there are external links and the name matches the inputval
      target = target[i]; //this is the correct object
    }
  }
  return target;
}

function createSocialArrays(target) {
  networkResults = []; //name of the networks
  networkLinks = []; //actual links
  for (let prop in target.externalLinks) {
    //loop through object keys
    if (prop !== 'itunes') {
      networkResults.push(prop.charAt(0).toUpperCase() + prop.substr(1));
    } else {
      networkResults.push(
        prop.charAt(0) + prop.charAt(1).toUpperCase() + prop.substr(2)
      );
    }
    networkLinks.push(target.externalLinks[prop][0].url); //pushes every link to array
  }

  return networkResults, networkLinks;
}

function combineSocialArrays(networkResults, networkLinks, inputVal) {
  if (networkResults.length === 0 || networkLinks.length === 0) {
    renderSocialLinksError(inputVal);
  } else {
    let html = [];
    for (let i = 0; i < networkResults.length; i++) {
      if (networkResults[i].toLowerCase() === 'homepage') {
        html.push(`
          <li><a href="${
            networkLinks[i]
          }" target="_blank"><i class="fas fa-globe"></i></i></a></li>
        `);
      } else if (
        networkLinks[i] !== undefined &&
        networkResults[i] !== 'Youtube' &&
        networkResults[i] !== 'Wiki'
      ) {
        html.push(`
          <li><a href="${
            networkLinks[i]
          }" target="_blank"><i class="fab fa-${networkResults[
          i
        ].toLowerCase()}"></i></a></li>
        `);
      }
    }
    html.push(
      `<li><a href="https://open.spotify.com/search/results/${inputVal}" target="_blank"><i class="fab fa-spotify"></i></a></li>`
    );
    html.push(
      `<li><a href="https://soundcloud.com/search?q=${inputVal}" target="_blank"><i class="fab fa-soundcloud"></i></a></li>`
    );
    html = html.join(''); //join the arrays items together
    return html;
  }
}

// Main Page Event Listeners

function navClicks() {
  $('#wiki-results-nav').on('click mouseover', function(event) {
    $('#wiki-results').fadeIn(600);
    $('#youtube-results').hide();
    $('#ticketmaster-results').hide();
    $('#music-links').hide();
    $('#artist-news').hide();
  });

  $('#youtube-results-nav').on('click mouseover', function(event) {
    $('#wiki-results').hide();
    $('#youtube-results').fadeIn(600);
    $('#ticketmaster-results').hide();
    $('#music-links').hide();
    $('#artist-news').hide();
  });

  $('#ticketmaster-results-nav').on('click mouseover', function(event) {
    $('#wiki-results').hide();
    $('#youtube-results').hide();
    $('#ticketmaster-results').fadeIn(600);
    $('#ticketmaster-results').css('display', 'flex');
    $('#music-links').hide();
    $('#artist-news').hide();
  });

  $('#music-links-nav').on('click mouseover', function(event) {
    $('#wiki-results').hide();
    $('#youtube-results').hide();
    $('#ticketmaster-results').hide();
    $('#music-links').fadeIn(600);
    $('#artist-news').hide();
  });

  $('#artist-news-nav').on('click mouseover', function(event) {
    $('#wiki-results').hide();
    $('#youtube-results').hide();
    $('#ticketmaster-results').hide();
    $('#music-links').hide();
    $('#artist-news').fadeIn(600);
    $('#artist-news').css('display', 'flex');
    $('#help-page').hide();
  });
}

const searchEx = [
  'Want some suggestions?',
  'Post Malone',
  'Drake',
  'Cardi B',
  'John Mayer',
  'The Beatles',
  'Taylor Swift',
  'Eminem',
  'Ed Sheeran',
  'Rihanna',
  'Bruno Mars',
  'Travis Scott',
  'Camilla Cabello',
  'Adele',
  'Justin Bieber'
];

setInterval(function() {
  $('input#search').click(function() {
    $(this).data('clicked', true);
  });

  if ($('input#search').data('clicked')) {
    return;
  }

  $('input#search').attr(
    'placeholder',
    searchEx[searchEx.push(searchEx.shift()) - 1]
  );
}, 600);

function scrollTop() {
  window.scroll(function() {
    if ($(this).scrollTop() >= 50) {
      $('#scroll-button').fadeIn(500);
    } else {
      $('#scroll-button').fadeOut(500);
    }
  });

  $('#scroll-button').click(function() {
    $('body, html').animate(
      {
        scrollTop: 0
      },
      500
    );
  });
}

$(watchForm);
