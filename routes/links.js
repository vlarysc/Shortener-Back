var express = require('express');
var router = express.Router();
const Link = require('../models/link');
const jwt = require('jsonwebtoken');

let SECRET = "app";

/* Realiza o decoded do token obtendo informações se o token ainda é valido ou não */
function verifyJWT(tokeToVerify) {
  let token = tokeToVerify;
  let decoded = jwt.verify(token, SECRET);

  return decoded;
}

/* Busca todos os links */
router.get('/', async function (req, res, next) {
  try {
    return res.json(await Link.findAll());
  } catch (error) {
    console.log(error)
  }
 
});
/* Busca todos os links baseados no uuid, caso não haja ele retorna apenas os links com uuid nulo */
router.get('/byId', async function (req, res, next) {
  const allLinks = await Link.findAll();
  try {
    const result = verifyJWT(req.headers.token);
    const getLinksById = await allLinks.filter((item) => {
      if (item.uuid === result.userId) {
        return item
      }
    });
    return res.json(getLinksById);
  } catch (error) {
    console.log(error)
  }
  const getAllLinks = await allLinks.filter((item) => {
    if (item.uuid === null) {
      return item
    }
  });
  return res.json(getAllLinks);
});

/* busca o link encurtado e aumenta o número de visualizações */
router.get('/:code', async function (req, res, next) {
  const code = req.params.code;
  const result = await Link.findOne({ where: { code } });
  if (!result) return res.sendStatus(404);
  result.hits++;
  await result.save();

  return res.redirect(result.url.includes('https://') ? result.url : `https://${result.url}`);
});

/* Apenas gera um texto aleatório que serve como código para o link encurtado */
function generateCode() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

/* cria um link encurtado */
router.post('/new', async function (req, res, next) {
  const { url, uuid } = req.body;
  const code = generateCode();
  try {
    if (url.length <= 0) return res.status(500).json({ error: error })
    /*await url.includes('http://') ? url : `http://${url}`*/
   const link = await Link.create({
      url,
      shortUrl: `http://localhost:3000/${code}`,
      nameUrl: url.split('.')[0],
      code,
      uuid
    })
    return res.status(201).json(link)
  } catch (error) {
    res.status(500).json({ error: error })
  }
});

/* Deleta o link do banco de dados que corresponde ao uuid */
router.delete('/:code', async function (req, res, next) {  
  const code = req.params.code;
  try {
    const result = verifyJWT(req.headers.token);
    const payload = await Link.findOne({ where: { code } });
    if (result.userId === payload.uuid) {
      await Link.destroy({ where: { code } })
      return res.status(201).json({ message: 'Usuário deletado com sucesso!!!' })
    } else {
     return res.status(404).json({ message: 'Você não tem permissão para deletar um link de outro usuário' })
    };
  } catch (error) {
    res.status(500).json({ error: error })
  }
  
});

module.exports = router;
