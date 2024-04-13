import {limit} from 'firebase/firestore';
import {connectToAlby} from './getToken';
import {decryptMessage} from './encodingAndDecodingMessages';

export async function initializeAblyFromHistory(
  updateFunction,
  masterInfoObject,
  userPubKey,
  userPrivKey,
) {
  console.log(userPubKey, 'USER PUB KEY');
  try {
    const realtime = connectToAlby();

    if (masterInfoObject.contacts.addedContacts.length === 0) return;

    console.log('DID RUN');
    const channel = realtime.channels.get(`blitzWalletPayments`);

    let receivedTransactions = {};
    let historicalTransactions = (await channel.history()).items.filter(
      item => item.name === userPubKey,
    );
    let count = 10;

    for (let index = 0; index < count; index++) {
      if (index > historicalTransactions.length) break;
      if (!historicalTransactions[index]) break;

      const {
        data: {sendingPubKey, data, uuid, paymentType},
        name,
      } = historicalTransactions[index];

      if (!sendingPubKey || !data || !uuid) continue;

      let tempReceivedObject = receivedTransactions[sendingPubKey] || [];

      let dd = decryptMessage(userPrivKey, sendingPubKey, data);

      dd = isJSON(dd) || dd;

      tempReceivedObject.push({
        data: dd,
        from: sendingPubKey,
        uuid: uuid,
        paymentType: paymentType,
      });

      receivedTransactions[sendingPubKey] = tempReceivedObject;
      // console.log(dd, name);
    }

    let newAddedContacts = [];
    let unseenTxCount = 0;

    for (
      let addedContactIndex = 0;
      addedContactIndex < masterInfoObject.contacts.addedContacts.length;
      addedContactIndex++
    ) {
      const contact = JSON.parse(
        JSON.stringify(
          masterInfoObject.contacts.addedContacts[addedContactIndex],
        ),
      ); // Deep copy
      let unlookedTransactions = [];

      for (
        let index = 0;
        index < Object.keys(receivedTransactions).length;
        index++
      ) {
        const transactions =
          receivedTransactions[Object.keys(receivedTransactions)[index]];
        const historicalTxUUIDGrouping =
          Object.keys(receivedTransactions)[index];

        if (contact.uuid != historicalTxUUIDGrouping) continue;

        const uniqueTransactions =
          combineUniqueObjects(
            [...contact.transactions],
            [...contact.unlookedTransactions],
            'uuid',
          ) || [];

        transactions.forEach(transaction => {
          if (
            uniqueTransactions.filter(
              uniqueTx => uniqueTx.uuid === transaction.uuid,
            ).length === 0
          ) {
            unlookedTransactions.push({...transaction, wasSeen: false});
            unseenTxCount++;
          }
        });
      }

      newAddedContacts.push({
        ...contact,
        transactions: contact.transactions,
        unlookedTransactions: contact.unlookedTransactions
          .concat(unlookedTransactions)
          .sort((a, b) => a.uuid - b.uuid),
      });
    }

    if (unseenTxCount === 0) return;

    updateFunction({
      contacts: {
        addedContacts: newAddedContacts,
        myProfile: {...masterInfoObject.contacts.myProfile},
      },
    });
  } catch (err) {
    console.log(err);
  }
}
function isJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return false;
  }
}
function combineUniqueObjects(arr1, arr2, prop) {
  const combinedSet = new Set(arr1.map(item => item[prop])); // Create a Set of unique values based on the specified property
  arr2.forEach(item => {
    // Loop through the second array
    if (!combinedSet.has(item[prop])) {
      // Check if the Set does not already contain the property value
      arr1.push(item); // If not, add the item to the first array
      combinedSet.add(item[prop]); // Also add the property value to the Set
    }
  });
  return arr1; // Return the combined array
}