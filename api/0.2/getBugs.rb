#!/usr/bin/ruby
# encoding: utf-8

require "mysql"
require "cgi"
require "json/ext"

require "./db_config.rb"

cgi = CGI.new
params = cgi.params

bbox = nil
bbox = params['bbox'][0].split(',').map {|v| v.to_f} if params['bbox'][0]

db = Mysql.connect($dbhost, $dbname, $dbuser, $dbpassword)
db.options(Mysql::SET_CHARSET_NAME, "utf8")

db.query("SET CHARSET utf8")
db.query("SET NAMES utf8")
if bbox
  res = db.query("SELECT * from bugs WHERE lon >= #{bbox[0]} AND lon <= #{bbox[2]} AND lat >= #{bbox[1]} AND lat <= #{bbox[3]} ORDER BY subtype")
else
  res = db.query("SELECT * from bugs ORDER BY subtype")
end

j = Hash.new
j['type'] = 'FeatureCollection'
j['features'] = Array.new

ja = j['features']

res.each_hash {|row|
  f = {
    'type' => 'Feature',
    'geometry' => {
    'type' => 'Point',
    'coordinates' => [row['lon'], row['lat']]
    },
    'properties' => {
        'id' => row['id'],
        'subtype' => row['subtype'],
        'type' => row['type'],
        'comments' => row['text'].split(/<hr \/>/).map {|comment| comment.gsub('&quot;', "\"").gsub('&lt;', "<").gsub('&gt;', ">").gsub('&amp;', "&")},
      }
  }
  ja << f
}

cgi.out {
  JSON.generate(j)
}
