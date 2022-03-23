    // Generates formatted date value: YYYY-MM-DD HH:MM:SS
    export function getTime() {
        let time = new Date()
        let currTime = `${time.getFullYear()}-${checkIfUnderTen(time.getMonth()+1)}-${checkIfUnderTen(time.getDate())} ${checkIfUnderTen(time.getHours())}:${checkIfUnderTen(time.getMinutes())}:${checkIfUnderTen(time.getSeconds())}`
        return currTime
      }
  
      function checkIfUnderTen(number) {
        return number = number < 10 ? '0' + number : number
      }