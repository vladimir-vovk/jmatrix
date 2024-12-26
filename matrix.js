import { rgb, greenBright, bgBlack, whiteBright } from 'ansis'

const showCursor = () => {
  process.stderr.write('\x1B[?25h')
}

const hideCursor = () => {
  process.stderr.write('\x1B[?25l')
}

const pause = async (ms) => {
  return new Promise((resolve) => setTimeout(() => resolve(), ms))
}

const write = (x, y, text, color = greenBright, force = false) => {
  const { rows, columns } = process.stdout
  if (x >= columns || y >= rows) {
    return
  }

  if (x < 0 || y < 0) {
    return
  }

  /* do not draw under the date-time */
  if (
    !force &&
    x >= state.dateTime.x &&
    x <= state.dateTime.x + state.dateTime.str.length - 1 &&
    y === state.dateTime.y
  ) {
    return
  }

  /* do not draw under the quote */
  if (
    !force &&
    y === state.quote.y &&
    x >= state.quote.x - 1 &&
    x <= state.quote.x + state.quote.value.length - 1
  ) {
    return
  }

  process.stdout.cursorTo(x, y)

  const colors = Array.isArray(color) ? color : [color]
  colors.unshift(bgBlack)
  const coloredText = colors.reduce((prev, c) => {
    return c`${prev}`
  }, text)

  process.stdout.write(coloredText)
}

const random = (start, end) => {
  return Math.floor(Math.random() * (end - start)) + start
}

const randomElement = (array) => {
  return array[random(0, array.length)]
}

const randomChar = () => {
  const chars =
    'abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVQXYZ*@$&^%#+=スシエカキクケコサスセソソタツテナヘホロヵ'.split(
      '',
    )
  return randomElement(chars)
}

const now = () => new Date().getTime()

const nowSec = () => Math.floor(now() / 1000)

const randomWord = () => {
  const data = Array(random(3, 10))
    .fill('')
    .map((_) => randomChar())
    .join('')
  const y = -1 * data.length - random(0, 12)

  return {
    data,
    y,
    updateAt: now(),
  }
}

const padZero = (num) => String(num).padStart(2, '0')

const currentDateTime = () => {
  const date = new Date()
  const day = padZero(date.getDate())
  const month = padZero(date.getMonth() + 1)
  const year = padZero(date.getFullYear())
  const seconds = padZero(date.getSeconds())
  const minutes = padZero(date.getMinutes())
  const hours = padZero(date.getHours())

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
}

const quotes = [
  'Wake up, Neo...',
  'The matrix has you',
  'Follow the white rabbit 🐰',
  `It's the question that drives us, Neo. It's the question that brought you here`,
  `Remember... all I'm offering is the truth. Nothing more`,
  `The body cannot live without the mind`,
  `I can only show you the door, you're the one that has to walk through it`,
  `What you know you can't explain, but you feel it. You've felt it your entire life`,
  `I don't like the idea that I’m not in control of my life`,
  'You have to let it all go, Neo - fear, doubt, and disbelief. Free your mind!',
  'There is no spoon',
  'Human beings are a disease. A cancer of this planet',
  'I know kung-fu!',
  `Do you think that's air you're breathing now?`,
  'Fate, it seems, is not without a sense of irony',
  'Ignorance is bliss',
  'The Matrix is everywhere. It is all around us. Even now in this very room',
  'What was said was for you, and you alone',
  'To deny our own impulses is to deny the very thing that makes us human',
  `Never send a human to do a machine's job`,
  'Guns. Lots of guns',
  'Goodbye, Mr. Anderson...',
  'What do all men with power want? More power',
  'Some people go their entire lives without hearing news that good',
  'Choice. The problem is choice',
  'Choice is an illusion created between those with power and those without',
  'Denial is the most predictable of all human responses',
  `There's a difference between knowing the path and walking the path`,
  'Welcome to the desert of the real',
  'Stop trying to hit me and hit me!',
  'The Matrix is the world that has been pulled over your eyes to blind you from the truth',
  'You have a problem with authority, Mr. Anderson',
  'Tell me, Mr. Anderson, what good is a phone call when you are unable to speak?',
  'What is “real”? How do you define “real”?',
  'Mr. Wizard! Get me the hell out of here!',
  'Were you listening to me, Neo? Or were you looking at the woman in the red dress?',
  'All I see now is blonde, brunette, redhead',
]

/*
 * Each column has words and speed.
 * And each word has data and current position.

   {
    updateAt: now() + 2000,
    speed: 200,
    x: 0,

    words: [
      {
        data: 'abc',
        y: -3,
        updateAt: now(),
      },
    ],
  },

 */
const state = {
  tick: 50,
  isIntro: true,
  columns: [],
  dateTime: {
    x: Math.floor(process.stdout.columns - currentDateTime().length),
    y: 0,
    value: nowSec(),
    str: currentDateTime(),
    green: 10,
    dc: 5, // delta color
  },
  quote: {
    index: 0,
    status: 'typing', // 'typing' | 'deleting'
    value: ' ',
    updateAt: now() + 500,
    typeDt: 80,
    deleteDt: 30,
    x: 1,
    y: 1,
    cursor: {
      symbol: '█',
      dt: 500,
      updateAt: now(),
    },
  },
}

const typeQuote = () => {
  const { cursor } = state.quote
  const { quote } = state
  const _now = now()
  const color = rgb(0, 255, 0)

  if (cursor.updateAt < _now) {
    cursor.updateAt = _now + cursor.dt
    const valueChars = quote.value.split('')
    const currentCursorChar = valueChars.pop()
    const nextCursorChar = currentCursorChar === ' ' ? cursor.symbol : ' '
    quote.value = `${valueChars.join('')}${nextCursorChar}`
    write(quote.x, quote.y, quote.value, color, true)
  }

  if (quote.updateAt < _now) {
    quote.updateAt = _now + quote.typeDt
    const valueChars = quote.value.split('')
    const cursorChar = valueChars.pop()
    const length = valueChars.length
    const quoteText = quotes[quote.index]

    if (length <= 0 && quote.status === 'deleting') {
      quote.index = random(0, quotes.length)
      quote.status = 'typing'
      quote.value = cursorChar
      quote.updateAt += 3000 + random(0, 5000)

      if (state.isIntro) {
        state.isIntro = false
      }
    } else if (length <= quoteText.length) {
      const _length = length + (quote.status === 'typing' ? 1 : -1)
      quote.value = `${quoteText.slice(0, _length)}${cursorChar}`

      if (_length === quoteText.length) {
        quote.status = 'deleting'
        quote.updateAt += 4000
      }
    }

    write(quote.x, quote.y, `${quote.value} `, color, true)
  }
}

const init = () => {
  const { rows, columns } = process.stdout
  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      write(i, j, ` `, bgBlack, true)
    }
  }

  for (let i = 0; i < columns / 2; i++) {
    state.columns.push({
      updateAt: now() + random(3000, 5000),
      speed: random(100, 500),
      x: i * 2,

      words: [randomWord()],
    })
  }
}

const updateLastChar = (text) => {
  if (Math.random() < 0.9) {
    return text
  }

  const chars = text.split('')
  chars[chars.length - 1] = randomChar()

  return chars.join('')
}

const changeRandomChars = (text) => {
  if (Math.random() < 0.95) {
    return text
  }

  const length = text.length
  const n = Math.floor(Math.random() * (length / 3))
  const chars = text.split('')
  for (let i = 0; i < n; i++) {
    const j = Math.floor(Math.random() * length)
    chars[j] = randomChar()
  }

  return chars.join('')
}

const updateWord = (word, speed) => {
  if (word.updateAt > now()) {
    const data = changeRandomChars(word.data)

    return {
      ...word,
      data: updateLastChar(data),
    }
  }

  const y = word.y + 1
  const { rows } = process.stdout
  const length = Math.min(y + word.data.length, rows + 1) - y
  const updatedWord = changeRandomChars(word.data)
  const data = `${updatedWord}${randomChar()}`.slice(1, length + 1)
  const updateAt = now() + speed

  return {
    ...word,
    data,
    y,
    updateAt,
  }
}

const updateColumn = (column) => {
  column.updateAt = now() + random(3000, 5000)

  if (random(0, 10) > 7) {
    column.speed = random(50, 500)
  }

  const word = column.words.find(({ y }) => y <= 1)
  if (!word) {
    column.words.push(randomWord())
  }
}

const update = () => {
  state.columns.forEach((column) => {
    if (column.updateAt <= now()) {
      updateColumn(column)
    }

    column.words = column.words
      .map((word) => updateWord(word, column.speed))
      .filter(({ data }) => data)
  })
}

const charColor = (chars, i) => {
  const length = chars.length - 1
  if (i === length) {
    return whiteBright
  } else {
    const g = Math.max(Math.floor((255 / Math.max(length - 1, 1)) * i), 30)
    return rgb(0, g, 0)
  }
}

const drawWord = (x, word) => {
  if (word.y - 1 >= 0) {
    write(x, word.y - 1, ' ')
  }

  const chars = word.data.split('')

  chars.forEach((char, i) => {
    const color = charColor(chars, i)
    write(x, word.y + i, char, color)
  })
}

const draw = () => {
  state.columns.forEach((column) => {
    column.words.forEach((word) => drawWord(column.x, word))
  })
}

const drawDateTime = () => {
  const seconds = nowSec()

  if (state.dateTime.value < seconds) {
    state.dateTime.value = seconds
    state.dateTime.str = currentDateTime()
  }

  state.dateTime.green += state.dateTime.dc
  if (state.dateTime.green > 255) {
    state.dateTime.dc = -1 * state.dateTime.dc
    state.dateTime.green = 255
  }

  if (state.dateTime.green < 10) {
    state.dateTime.dc = -1 * state.dateTime.dc
    state.dateTime.green = 50
  }

  write(
    state.dateTime.x,
    state.dateTime.y,
    state.dateTime.str,
    [bgBlack, rgb(0, state.dateTime.green, 0)],
    true,
  )
}

const main = async () => {
  hideCursor()
  console.clear()
  init()

  while (state.isIntro) {
    typeQuote()
  }

  while (true) {
    await pause(state.tick)
    update()
    draw()
    drawDateTime()
    typeQuote()
  }
}

process.on('SIGINT', () => {
  console.clear()
  showCursor()
  process.exit()
})

main()
