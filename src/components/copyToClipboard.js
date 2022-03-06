export default function copyToClipboard(value){
  const tempInput = document.createElement("input")
  tempInput.setAttribute("value", value)

  document.body.appendChild(tempInput)
  tempInput.select();
  tempInput.setSelectionRange(0, 99999) /* For mobile devices */
  document.execCommand("copy")
  document.body.removeChild(tempInput)
}