# EventEmitter

This smart contract aims to provide an easy connection between web2 and web3 services, using blockChain events and trusted authorities (Web2). It should enable easy payments with ERC20 tokens to your web2/web3 application.

# How to use it
First you should create an authority (empty wallet), to verify the order send by the user;
The user should create an order containing the following:
The order should contain:
```
const order = {
  authority: THE_AUTHORITY_ADDRESS,
  sender: THE_ADDRESS_OF_THE_USER_CALLING_THE_CONTRACT,
  recipient: ADDRESS_OF_YOUR_ACCOUNT,
  erc20Token: THE_ADDRESS_OF_THE_TOKEN_BEING_TRANSACTED
  amount: AMOUNT_TO_BE_SENT,
  eventMessage: "Optional message that can be used by your application" || ""
}
```
To execute the order, aka transfer the tokens and emit an event, the user and the authority should sign the message. The reason why the authority has to sing the message too is to provide the ability of the backend to execute off chain validations to the order.
After both, the user and the authority have signed the order, following the EIP712 standard, anyone can call the contract to emit the event, making it possible to provide "gasLess" functionality to the end user.

`eventEmitter(order, authoritySignature, userSignature)`
