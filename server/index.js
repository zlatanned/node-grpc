const PROTO_PATH = "./customers.proto";

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
let { randomUUID: uuid } = require('crypto');

// protoLoader takes care of coversion of proto into a JavaScript object. Return type is object
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
	keepCase: true,
	longs: String,
	enums: String,
	arrays: true
});

const customersProto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

// Dummy data used instead of DB
const customers = [
	{
		id: "a68b823c-7ca6-44bc-b721-fb4d5312cafc",
		name: "Akshay Shahi",
		age: 27,
		address: "India"
	},
	{
		id: "34415c7c-f82d-4e44-88ca-ae2a1aaa92b7",
		name: "Lionel Messi",
		age: 30,
		address: "Argentina"
	}
];

server.addService(customersProto.CustomerService.service, {
	getAll: (_, callback) => {
		callback(null, { customers });
	},

	get: (call, callback) => {
		let customer = customers.find(n => n.id == call.request.id);

		if (customer) {
			callback(null, customer);
		} else {
			callback({
				code: grpc.status.NOT_FOUND,
				details: "Not found"
			});
		}
	},

	insert: (call, callback) => {
		let customer = call.request;
		
		customer.id = uuid();
		customers.push(customer);
		callback(null, customer);
	},

	update: (call, callback) => {
		let existingCustomer = customers.find(n => n.id == call.request.id);

		if (existingCustomer) {
			existingCustomer.name = call.request.name;
			existingCustomer.age = call.request.age;
			existingCustomer.address = call.request.address;
			callback(null, existingCustomer);
		} else {
			callback({
				code: grpc.status.NOT_FOUND,
				details: "Not found"
			});
		}
	},

	remove: (call, callback) => {
		let existingCustomerIndex = customers.findIndex(
			n => n.id == call.request.id
		);

		if (existingCustomerIndex != -1) {
			customers.splice(existingCustomerIndex, 1);
			callback(null, {});
		} else {
			callback({
				code: grpc.status.NOT_FOUND,
				details: "Not found"
			});
		}
	}
});

/*
 * The bind() function received the authentication object as the second parameter, for simplicity we’ll use it insecurely
 */
server.bindAsync(
    "127.0.0.1:30043", grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      console.log("Server at port:", port);
      console.log("Server running at http://127.0.0.1:30043");
      server.start();
    }
  );