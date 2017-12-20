//# sourceURL=application.js

//
//  application.js
//  internet-archive
//
//  Created by Richard Foster on 20/12/2017.
//  Copyright © 2017 Richard Foster. All rights reserved.
//

/*
 * This file provides an example skeletal stub for the server-side implementation
 * of a TVML application.
 *
 * A javascript file such as this should be provided at the tvBootURL that is
 * configured in the AppDelegate of the TVML application. Note that  the various
 * javascript functions here are referenced by name in the AppDelegate. This skeletal
 * implementation shows the basic entry points that you will want to handle
 * application lifecycle events.
 */

/**
 * @description The onLaunch callback is invoked after the application JavaScript
 * has been parsed into a JavaScript context. The handler is passed an object
 * that contains options passed in for launch. These options are defined in the
 * swift or objective-c client code. Options can be used to communicate to
 * your JavaScript code that data and as well as state information, like if the
 * the app is being launched in the background.
 *
 * The location attribute is automatically added to the object and represents
 * the URL that was used to retrieve the application JavaScript.
 */
App.onLaunch = function(options) {
  // var alert = createAlert("Hello World!", "Welcome to tvOS");
  // navigationDocument.pushDocument(alert);

  console.log('kicking off')
  createHomepage(doc => {
    console.log('created a homepage?')

    doc.addEventListener('select', event => {
      const url = event.target.getAttribute('videoURL')

      if (url) {
        const player = new Player()
        const playlist = new Playlist()
        const mediaItem = new MediaItem('video', url)

        player.playlist = playlist
        player.playlist.push(mediaItem)
        player.present()
      }
    })

    navigationDocument.pushDocument(doc)
  })
}


App.onWillResignActive = function() {

}

App.onDidEnterBackground = function() {

}

App.onWillEnterForeground = function() {

}

App.onDidBecomeActive = function() {

}

App.onWillTerminate = function() {

}

/**
 * This convenience funnction returns an alert template, which can be used to present errors to the user.
 */
var createAlert = function(title, description) {
  var alertString = `<?xml version="1.0" encoding="UTF-8" ?>
    <document>
      <alertTemplate>
        <title>${title}</title>
        <description>${description}</description>
      </alertTemplate>
    </document>`

  var parser = new DOMParser()
  var alertDoc = parser.parseFromString(alertString, 'application/xml')

  return alertDoc
}

var createHomepage = function (callback) {
    const url = 'http://archive.org/advancedsearch.php?q=collection%3Afeature_films&rows=100&page=1&output=json&sort%5B%5D=downloads+desc&mediatype=movies'
    const success = filmsData => {
      console.log('request made')
      console.log(filmsData)

      console.log('got filmsData')
      console.log(filmsData)

      const createLockup = (film, metadata) => {
        console.log('film here')
        console.log(film)
        console.log(metadata)
        const url = metadata.files.find(file => file.format.indexOf('MPEG') > -1 || file.format === 'Cinepack').name
        const thumb = metadata.files.find(file => file.format === 'Thumbnail').name

        return `
          <lockup videoURL="http://archive.org/download/${film.identifier}/${url}">
            <img src="http://archive.org/download/${film.identifier}/${thumb}" width="500" height="308" />
            <title>${film.title}</title>
          </lockup>
        `
      }

      const films = filmsData.response.docs.filter(doc => doc.mediatype === 'movies').slice(0, 25)
      const filmMetadataUrls = films.map(film => {
        return `http://archive.org/metadata/${film.identifier}`
      })

      console.log('all films')
      console.log(films)

      console.log('all film metadatas')
      console.log(filmMetadataUrls)

      waterfall(ajaxget, filmMetadataUrls, function (filmMetadatas) {
        const str = `<?xml version="1.0" encoding="UTF-8" ?>
          <document>
            <catalogTemplate>
              <banner>
                <title>Internet Archive</title>
              </banner>
              <list>
                <section>
                  <listItemLockup>
                    <title>Popular</title>
                    <decorationLabel>${films.length}</decorationLabel>
                    <relatedContent>
                      <grid>
                        <section>
                          ${films.map((film, idx) => createLockup(film, filmMetadatas[idx]))}
                        </section>
                      </grid>
                    </relatedContent>
                  </listItemLockup>
                </section>
              </list>
            </catalogTemplate>
          </document>`

        console.log('str here')
        console.log(str)

        const parser = new DOMParser()
        const doc = parser.parseFromString(str, 'application/xml')

        callback(doc)
      })
    }

    console.log('lets make a get request')
    const error = err => console.log('err', err)

    ajaxget(url, success, error)
}

function ajaxget (url, successHandler, errorHandler) {
  console.log('MAKING GET REQUEST')
  console.log('WITH URL')
  console.log(url)
  var xhr = new XMLHttpRequest()
  xhr.open('get', url, true)
  xhr.onreadystatechange = function() {
    console.log('on ready state change')
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        const data = JSON.parse(xhr.responseText)
        successHandler(data)
      } else {
        errorHandler(xhr.status)
      }
    }
  }

  xhr.send()
}

function waterfall (func, argsList, finalCallback) {
  const next = function (results, remaining) {
    if (remaining.length === 0) {
      console.log('done, final callback time')
      return finalCallback(results)
    }

    const args = remaining.shift()
    const callback = result => {
      next(results.concat(result), remaining)
    }

    const errCallback = err => {
      console.log('err', err)
      next(results, remaining)
    }

    func(args, callback, errCallback)
  }

  next([], argsList)
}
