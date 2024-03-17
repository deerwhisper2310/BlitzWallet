import {setLocalStorageItem} from '../localStorage';

export default async function updateContactProfile(
  update,
  contacts,
  selectedContact,
) {
  const newContacts = contacts.map(contact => {
    if (contact.npub === selectedContact.npub) {
      return {...contact, ...update};
    } else {
      return contact;
    }
  });

  const didSet = await setLocalStorageItem(
    'contacts',
    JSON.stringify(newContacts),
  );
  return new Promise(resolve => {
    resolve(didSet);
  });
}
