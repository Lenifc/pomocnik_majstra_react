import firebase from 'firebase/app'

export async function callTicketsHistory(VIN) {
  let ticketsHistory = []
  const paths = ['wolne', 'obecne', 'zakonczone']

  paths.forEach(async path => {
    // console.log(path, VIN, phoneNum);

    const clients = firebase.firestore()
      .collection('warsztat')
      .doc('zlecenia').collection(path)
      .where(`VIN`, '==', VIN)

    const response = await clients.get()

    let outData = response.docs.map(doc => doc.data())
    // console.log(outData);

    if (outData) ticketsHistory.push([path, outData])
    if (ticketsHistory.length == 3) return ticketsHistory

  })
  return ticketsHistory
}