  // creates phone number in polish format: XXX-XXX-XXX or XXX-XX-XX, removes any other character than numbers and adds '-' in beetween
export default function validPhoneNum(number) {
  if(number){
    let temp = number.replace(/[^0-9]+/g, '');
    if (temp.length === 9) {
      return temp.slice(0, 3) + "-" + temp?.slice(3, 6) + "-" + temp.slice(6, 9);
    }
    if (temp.length === 7) {
      return temp.slice(0, 3) + "-" + temp?.slice(3, 5) + "-" + temp.slice(5, 8);
    }
  }
    return false
  }