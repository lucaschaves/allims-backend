const tryParseJson = async (value, defaultValue) => {
    try {
        if (!defaultValue) defaultValue = value
        if (!value) return defaultValue
        return JSON.parse(value)
    } catch (err) {
        return defaultValue
    }
}
  
  const isNumber = async (text = '') => {
    try {
        for (let i = 0; i < text.length; i++) {
            if (isNaN(Number.parseInt(text[i]))) return false
        }
        return true
    } catch (error) {
        return false
    }
}

module.exports = { tryParseJson, isNumber }