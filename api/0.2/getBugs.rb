#!/usr/bin/ruby
# encoding: utf-8

require "mysql"
require "cgi"
require "json/ext"

require "./db_config.rb"


class BugsController
  def initialize
    @cgi = CGI.new
    @params = @cgi.params

    @db = Mysql.connect($dbhost, $dbuser, $dbpassword, $dbname)
    @db.options(Mysql::SET_CHARSET_NAME, "utf8")

    @db.query("SET CHARSET utf8")
    @db.query("SET NAMES utf8")
  end

  def dispatch!
    case @cgi.request_method
    when 'GET':
      get_features
    when 'POST':
      create_feature
    when 'PUT':
      update_feature
    else get_features
    end
  end

  def get_features
    bbox = nil
    bbox = @params['bbox'][0].split(',').map {|v| v.to_f} if @params['bbox'][0]

    if bbox
      res = @db.query("SELECT * from bugs WHERE lon >= #{bbox[0]} AND lon <= #{bbox[2]} AND lat >= #{bbox[1]} AND lat <= #{bbox[3]} AND type != 2 ORDER BY subtype")
    else
      res = @db.query("SELECT * from bugs WHERE type != 2 ORDER BY subtype")
    end

    j = Hash.new
    j['type'] = 'FeatureCollection'
    j['features'] = Array.new

    ja = j['features']

    res.each_hash {|row|
      f = {
        'type' => 'Feature',
        'id' => row['id'],
        'geometry' => {
        'type' => 'Point',
        'coordinates' => [row['lon'], row['lat']],
      },
      'properties' => {
        'subtype' => row['subtype'],
        'type' => row['type'],
        'comments' => row['text'].split(/<hr \/>/).map {|comment| comment.gsub('&quot;', "\"").gsub('&lt;', "<").gsub('&gt;', ">").gsub('&amp;', "&")},
      }
      }
      ja << f
    }

    @cgi.out {
      JSON.generate(j)
    }
  end

  def create_feature
    result = Hash.new
    result['type'] = 'FeatureCollection'
    res_features = result['features'] = Array.new

    f = nil
    j = JSON.parse(@params.keys[0])
    j['features'].each {|feature|
      subtype = feature['properties']['subtype']
      subtype ||= 'kerb'

      text = feature['properties']['comments'].join('<hr />') if feature['properties']['comments'].kind_of?(Array)
      text ||= ''

      g = feature['geometry']
      @db.query("INSERT INTO bugs (lon, lat, type, subtype, text) VALUES(#{g['coordinates'][0]}, #{g['coordinates'][1]}, 0, '#{subtype}', '#{text}')")
      id = @db.insert_id
      res = @db.query("SELECT * FROM bugs WHERE id=#{id}")

      res.each_hash {|row|
        f = {
          'type' => 'Feature',
          'id' => row['id'],
          'geometry' => {
          'type' => 'Point',
          'coordinates' => [row['lon'], row['lat']],
        },
        'properties' => {
          'subtype' => row['subtype'],
          'type' => row['type'],
          'comments' => row['text'].split(/<hr \/>/).map {|comment| comment.gsub('&quot;', "\"").gsub('&lt;', "<").gsub('&gt;', ">").gsub('&amp;', "&")},
        }
        }
        res_features << f
      }
    }

    @cgi.out {
      JSON.generate result
    }
  end
end

bc = BugsController.new
bc.dispatch!

