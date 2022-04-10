import { jsPDF } from "jspdf"
import unidecode from 'unidecode' // workaround for polish-characters
// import '../fonts/WorkSans/WorkSans-Regular'

// Default export is a4 paper, portrait, using millimeters for units

var invoiceData
var tableData
var headers = createHeaders([
  "l.p.",
  "Towar/Usluga",
  "Ilosc [szt./l.]",
  "Cena netto",
  "Wartosc netto",
  "Stawka VAT",
  "Cena brutto",
  "Wartosc brutto",
])

function createHeaders(keys) {
  var result = [];
  for (var i = 0; i < keys.length; i += 1) {
    result.push({
      id: keys[i],
      name: keys[i],
      prompt: keys[i],
      width: i == 0 ? 16 : i == 1 ? 69 : i == 2 || i == 5 ? 26 : 32, // assign correct table width depending on its property
      align: "center",
      padding: 0,
    });
  }
  return result
}

var generateData = function(amount) {
  var result = []
  var data
  for (var count = 0; count < amount; count += 1) {
    data = {
    'Towar/Usluga': unidecode(tableData[count]['part_service_Name']),
    'Ilosc [szt./l.]': `${tableData[count]['quantity']}`,
    'Cena netto': `${tableData[count]['price_net']}`,
    'Wartosc netto': `${tableData[count]['totalCost_net']}`,
    'Stawka VAT': `${tableData[count]['tax']}%`,
    'Cena brutto': `${tableData[count]['price_gross']}`,
    'Wartosc brutto': `${tableData[count]['totalCost_gross']}`,
  }
    data['l.p.'] = (count + 1).toString();
    result.push(Object.assign({}, data));
  }
  return result
}

function calcTotalNet(order) {
  let totalNet = 0
  if(order) order.forEach(item => {
    totalNet += Number(item['totalCost_net'])
  })
  return totalNet.toFixed(2)
}
function calcTotalGross(order) {
  let totalGross = 0
  if(order) order.forEach(item => {
    totalGross += Number(item['totalCost_gross'])
  })
  return totalGross.toFixed(2)
}

export function fetchInvoiceData(providedData) {
  invoiceData = providedData
  tableData = providedData?.invoiceData?.Wykonane_uslugi_czesci
}


export function createPDF(){
  const doc = new jsPDF()

  // doc.addFont("../fonts/WorkSans/WorkSans-Regular.ttf", "WorkSans", "normal") // przetestowac jakas kompatybilna czcionka
  // doc.setFont("WorkSans", 'normal'); // set font

  // .addImage("../assets/logo.PNG", "JPEG", 15, 40, 180, 180)
  doc
  .text(unidecode("WARSZTAT_XD"), 10, 10)
  .setFont('times', "bold")
  .text(`Faktura nr ${invoiceData?.invoiceNumber}/${invoiceData?.getYear}`, 100, 10, null, null, "center")
  .setFont('times', "normal")
  .setFontSize(12)
  .text(`Data wystawienia: ${invoiceData?.getTodaysDate}`, 200, 10, null, null, "right")
  .setFont('times', "bold")
  .setFontSize(14)
  .text("SPRZEDAWCA", 10, 25)
  .setFontSize(13)
  .setFont('times', "normal")
  .text(`
${invoiceData?.workshopData?.nazwaWarsztatu}\n` + 
`${invoiceData?.workshopData?.kodPocztowy} ${invoiceData?.workshopData?.miejscowosc}\n` + 
`${invoiceData?.workshopData?.adres}\n` +
`NIP: ${invoiceData?.workshopData?.NIP}\n` +
`Tel: ${invoiceData?.workshopData?.numerTelefonu}\n` +
`email: ${invoiceData?.workshopData?.email}\n` +
`nr konta: ${invoiceData?.workshopData?.kontoBankowe}\n`, 10, 25)
  .setFont('times', "bold")
  .setFontSize(14)
  .text("NABYWCA", 10, 75)
  .setFontSize(13)
  .setFont('times', "normal")
  .text( `${unidecode(invoiceData?.clientData?.Imie) || unidecode(invoiceData?.invoiceData?.Imie)}\n` +
`${invoiceData?.clientData?.Rodzaj != 'Prywatny' ? 'NIP: ' + invoiceData?.clientData?.NIP + '\n' : ''}` +
`Tel: ${invoiceData?.clientData?.Tel || invoiceData?.invoiceData?.Tel} ${invoiceData?.clientData?.Tel2 || ''}\n` +
`${invoiceData?.clientData?.KodPocztowy || invoiceData?.invoiceData?.KodPocztowy || ''} ${unidecode(invoiceData?.invoiceData?.Miejscowosc) + '\n' || unidecode(invoiceData?.invoiceData?.Miejscowosc) + '\n' || ''}` +
`${invoiceData?.clientData?.Adres || invoiceData?.invoiceData?.Adres || ''}\n`,10, 80)
  .setFontSize(11)
  .text(`${invoiceData?.invoiceData?.['Marka']?.toUpperCase()} ${invoiceData?.invoiceData?.['Model']} ${invoiceData?.invoiceData?.['Wersja_Rocznik'] || ''}, ${
        invoiceData?.invoiceData?.['VIN']}, ${invoiceData?.invoiceData?.['Numer_rejestracyjny'] || ''} ${invoiceData?.invoiceData?.['Przebieg'] ? 
        ', Stan licznika: ' + invoiceData?.invoiceData?.['Przebieg'] + 'km' : ''}`, 10, 102)
  .setFont('times', 'normal')
  .setFontSize(13)
  .table(5, 105, generateData(tableData.length), headers, { autoSize: false})
  .setFontSize(15)
  .setFont('times', 'bold')
  .text('Do zaplaty: ', 40, 265)
  .setTextColor('#B62A70')
  .text(`${calcTotalGross(tableData)} PLN`, 67, 265)
  .setTextColor("black")
  .setFontSize(14)
  .text('Netto: ', 105, 265)
  .setTextColor('#B62A70')
  .text(`${calcTotalNet(tableData)} PLN`, 119, 265)
  .setTextColor("black")
  .setFont('times', 'normal')
  .setFontSize(13)
  .text('Podpis nabywcy', 60, 285, null, null, 'center')
  .text('Podpis sprzedajacego', 135, 285, null, null, 'center')
  .setLineWidth(0.5)
  .line(80, 278, 40, 278)
  .line(110, 278, 160, 278)
  .setFontSize(11)
  .text(`${invoiceData.workshopData.stopka}`, 105, 294, null, null, 'center')


  doc.save(`${invoiceData?.invoiceData?.VIN}.pdf`)
  }