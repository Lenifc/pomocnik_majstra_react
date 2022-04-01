
export function betterLooking(value) {
    let temp = value
    temp = temp.replace('-', ' ')
    // Changes every first letter to be Uppercase - even letters after '-'
    temp = temp.trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())))
    value = temp.replace(' ', '-')
    return value
  }

export function replaceSpaces(value) {
    if(value.length){
      value = value.replace(" ", "-")
      return value.replace(/[!@#$%^&*(){}<>?.;+_]/g, '') // to fetch data it is important to clear all special characters like '-', '!', '%', etc.
      // f.e. 'up!' -> 'up' ; special 'Ś' mark at Skoda etc.
    }
  }

export function onlyNumbers(input) {
    return String(input).replace(/[^0-9]+/g, '')
 } 