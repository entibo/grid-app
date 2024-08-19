async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const parser = new DOMParser()

function isErrorPage(document) {
  const header = document.querySelector('h1, h2, h3, h4, h5, h6')
  return header && header.textContent.match(/error/i)
}

function containsMonoStyle(document) {
  const paragraphs = document.querySelectorAll('p.mini')
  return Array.from(paragraphs).some((p) => p.textContent.match(/mono/i))
}

async function processLinks() {
  const monoStyleNames = []
  const links = Array.from($$('.fontlistitem > a')).map((a) => a.href)
  const batchSize = 5
  for (let i = 0; i < links.length; i += batchSize) {
    const batch = links.slice(i, i + batchSize)
    const promises = batch.map(async (link) => {
      const name = new URL(link).pathname.split('/').pop() ?? link
      const response = await fetch(link)
      const html = await response.text()
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      const document = parser.parseFromString(html, 'text/html')
      if (isErrorPage(document)) {
        console.error('Error page detected: ', name)
      }
      if (containsMonoStyle(document)) {
        monoStyleNames.push(name)
        console.log('✅', name)
      } else {
        console.log('❌', name)
      }
    })
    await Promise.all(promises)
    // wait(100)
  }

  console.log('🎉 All done! Here are the mono style fonts found:')
  for (const name of monoStyleNames) {
    console.log(name)
    window.open('/fonts/' + name)
  }
}

processLinks()
