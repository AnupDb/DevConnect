const express = require('express')
const router = express.Router()

router.route('/').get(async (req, res) => {
    res.send('Auth route')
})

module.exports = router