#!/usr/bin/ruby
# encoding: utf-8

require 'mysql'
require 'sinatra/base'
require 'json/ext'

require File.join(File::dirname(__FILE__), "db_config.rb")

class Bugs < Sinatra::Base
  def initialize
    super

    @db = Mysql.connect($dbhost, $dbuser, $dbpassword, $dbname)
    @db.options(Mysql::SET_CHARSET_NAME, "utf8")

    @db.query("SET CHARSET utf8")
    @db.query("SET NAMES utf8")
  end

  configure do
    set :run, false
  end

  get '/' do
    bbox = nil
    bbox = params[:bbox].split(',').map {|v| v.to_f} if params['bbox']

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
        'comments' => row['text'].force_encoding("utf-8").split(/<hr \/>/).map {|comment| comment.gsub('&quot;', "\"").gsub('&lt;', "<").gsub('&gt;', ">").gsub('&amp;', "&")},
      }
      }
      ja << f
    }

    JSON.generate(j)
  end

  post '/' do
    result = Hash.new
    result['type'] = 'FeatureCollection'
    res_features = result['features'] = Array.new

    f = nil
    j = JSON.parse(request.body.read)
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
          'comments' => row['text'].force_encoding("utf-8").split(/<hr \/>/).map {|comment| comment.gsub('&quot;', "\"").gsub('&lt;', "<").gsub('&gt;', ">").gsub('&amp;', "&")},
        }
        }
        res_features << f
      }
    }

    JSON.generate result
  end

  put '/:id' do
    feature = JSON.parse(request.body.read)

    subtype = feature['properties']['subtype']
    subtype ||= 'kerb'

    text = feature['properties']['comments'].join('<hr />') if feature['properties']['comments'].kind_of?(Array)
    text ||= ''

    g = feature['geometry']
    @db.query("UPDATE bugs SET lon=#{g['coordinates'][0]}, lat=#{g['coordinates'][1]}, type='#{feature['properties']['type']}', subtype='#{subtype}', text='#{text}' WHERE id=#{feature['id']}")
    res = @db.query("SELECT * FROM bugs WHERE id=#{feature['id']}")

    f = nil
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
        'comments' => row['text'].force_encoding("utf-8").split(/<hr \/>/).map {|comment| comment.gsub('&quot;', "\"").gsub('&lt;', "<").gsub('&gt;', ">").gsub('&amp;', "&")},
      }
      }
    }

    JSON.generate f
  end

  delete '/:id' do
    @db.query("UPDATE bugs SET type=2 WHERE id=#{params[:id]}")
  end
end

Rack::Handler::CGI.run(Bugs)

