export default function (string){
    let upper = string.toUpperCase()
    let validLetters = upper.replace(/[^a-zA-Z0-9]/gi,'');
    let trim = validLetters.replace(" ", "")

    if (trim.length < 16 || trim.length > 17) {
        return false
      }
    return trim
}