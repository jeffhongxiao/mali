import test from 'ava'
import path from 'path'
import grpc from 'grpc'
import _ from 'lodash'
import pMap from 'p-map'

import Mali from '../lib'
import * as tu from './util'

const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
const PROTO_PATH_MULTI = path.resolve(__dirname, './protos/multi.proto')

const apps = []

const STATIC_HOST = tu.getHost()
const DYNAMIC_HOST = tu.getHost()

test.serial('should dynamically create service', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(DYNAMIC_HOST)
  t.truthy(server)
})

test.serial('should dynamically create service without a service name', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(DYNAMIC_HOST)
  t.truthy(server)
})

test.serial('should statically create service', t => {
  const messages = require('./static/helloworld_pb')
  const services = require('./static/helloworld_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services, 'GreeterService')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(STATIC_HOST)
  t.truthy(server)
})

test.serial('should statically create service without a service name', t => {
  const messages = require('./static/helloworld_pb')
  const services = require('./static/helloworld_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services)
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(STATIC_HOST)
  t.truthy(server)
})

test.cb('call dynamic service', t => {
  t.plan(4)
  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(DYNAMIC_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.truthy(response.message)
    t.is(response.message, 'Hello Bob')
    t.end()
  })
})

test.cb('call static service', t => {
  t.plan(5)

  const messages = require('./static/helloworld_pb')
  const services = require('./static/helloworld_grpc_pb')

  const client = new services.GreeterClient(STATIC_HOST, grpc.credentials.createInsecure())

  const request = new messages.HelloRequest()
  request.setName('Jane')
  client.sayHello(request, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.truthy(response.getMessage)
    const msg = response.getMessage()
    t.truthy(msg)
    t.is(msg, 'Hello Jane')
    t.end()
  })
})

test.serial('should dynamically create service using object specifying root and file', async t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const load = {
    root: __dirname,
    file: 'protos/helloworld.proto'
  }

  const app = new Mali(load, 'Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
  await app.close()
})

test.serial('should dynamically create service using object specifying root and file using imports', async t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const load = {
    root: __dirname,
    file: 'protos/load.proto'
  }

  const app = new Mali(load, 'Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
  await app.close()
})

test.after.always('cleanup', async t => {
  await pMap(apps, app => app.close())
})

test.serial('should dynamically create a named service from defition with multiple services', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH_MULTI, 'Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(DYNAMIC_HOST)
  t.truthy(server)
})

test.serial('should dynamically create all named services from defition with multiple services', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH_MULTI, [ 'Greeter', 'Greeter2' ])
  t.truthy(app)
  t.truthy(app.services)
  t.is(_.keys(app.services).length, 2)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(DYNAMIC_HOST)
  t.truthy(server)
})

test.serial('should dynamically create all services from defition with multiple services', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH_MULTI)
  t.truthy(app)
  t.truthy(app.services)
  t.is(_.keys(app.services).length, 4)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(DYNAMIC_HOST)
  t.truthy(server)
})

test.serial('should statically create a named service from defition with multiple services', t => {
  const messages = require('./static/multi_pb')
  const services = require('./static/multi_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services, 'GreeterService')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(STATIC_HOST)
  t.truthy(server)
})

test.serial('should statically create all named services from defition with multiple services', t => {
  const messages = require('./static/multi_pb')
  const services = require('./static/multi_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services, [ 'GreeterService', 'Greeter2Service' ])
  t.truthy(app)
  t.truthy(app.services)
  t.is(_.keys(app.services).length, 2)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(STATIC_HOST)
  t.truthy(server)
})

test.serial('should statically create all services from defition with multiple services', t => {
  const messages = require('./static/multi_pb')
  const services = require('./static/multi_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services)
  t.truthy(app)
  t.truthy(app.services)
  t.is(_.keys(app.services).length, 4)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(STATIC_HOST)
  t.truthy(server)
})
