import urllib2
import simplejson


GOOGLE_API_KEY = 'AIzaSyDQORZzmiiiWOS41SmwPoBU63NZD6j3MEk'
BASE_URL = 'https://ajax.googleapis.com/ajax/services/search/images?'
PROTOCAL_VERSION = 'v=1.0'
USER_IP = '&userip='

search_term = 'square'

url = BASE_URL + PROTOCAL_VERSION + '&q=' + search_term + USER_IP

# def get_search_term():
#   search_term = /* from user input */
#   search_term = searchTerm.replace(' ','%20')


request = urllib2.Request(url, None, {'Referer': 'http://www.seas.upenn.edu/~skrueger/'})
response = urllib2.urlopen(request)

# Process the JSON string
results = simplejson.load(response)