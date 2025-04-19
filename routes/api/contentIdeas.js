const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Product = require('../../models/Product');
const ContentIdea = require('../../models/ContentIdea');

// @route    GET api/content-ideas
// @desc     Get all content ideas for a user
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const contentIdeas = await ContentIdea.find({ user: req.user.id })
      .populate('product', 'name variant')
      .sort({ postDateNeeded: 1 });
    res.json(contentIdeas);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/content-ideas/product/:productId
// @desc     Get all content ideas for a specific product
// @access   Private
router.get('/product/:productId', auth, async (req, res) => {
  try {
    const contentIdeas = await ContentIdea.find({ 
      user: req.user.id,
      product: req.params.productId 
    }).sort({ postDateNeeded: 1 });
    res.json(contentIdeas);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/content-ideas
// @desc     Create a new content idea
// @access   Private
router.post('/', [
  auth,
  [
    check('product', 'Product is required').not().isEmpty(),
    check('postDateNeeded', 'Post date is required').not().isEmpty(),
    check('videoConcept', 'Video concept is required').not().isEmpty(),
    check('hook', 'Hook is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      product,
      postDateNeeded,
      status,
      videoConcept,
      hook,
      script,
      sound,
      props
    } = req.body;

    // Check if product exists and belongs to user
    const productExists = await Product.findOne({ 
      _id: product,
      user: req.user.id
    });

    if (!productExists) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    const newContentIdea = new ContentIdea({
      user: req.user.id,
      product,
      postDateNeeded,
      status: status || 'Not Started',
      videoConcept,
      hook,
      script: script || '',
      sound: sound || '',
      props: props || ''
    });

    const contentIdea = await newContentIdea.save();
    res.json(contentIdea);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/content-ideas/:id
// @desc     Update a content idea
// @access   Private
router.put('/:id', auth, async (req, res) => {
  try {
    let contentIdea = await ContentIdea.findById(req.params.id);

    if (!contentIdea) {
      return res.status(404).json({ msg: 'Content idea not found' });
    }

    // Make sure user owns the content idea
    if (contentIdea.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const {
      postDateNeeded,
      status,
      videoConcept,
      hook,
      script,
      sound,
      props
    } = req.body;

    // Build update object
    const contentIdeaFields = {};
    if (postDateNeeded) contentIdeaFields.postDateNeeded = postDateNeeded;
    if (status) contentIdeaFields.status = status;
    if (videoConcept) contentIdeaFields.videoConcept = videoConcept;
    if (hook) contentIdeaFields.hook = hook;
    if (script !== undefined) contentIdeaFields.script = script;
    if (sound !== undefined) contentIdeaFields.sound = sound;
    if (props !== undefined) contentIdeaFields.props = props;

    contentIdea = await ContentIdea.findByIdAndUpdate(
      req.params.id,
      { $set: contentIdeaFields },
      { new: true }
    );

    res.json(contentIdea);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/content-ideas/:id
// @desc     Delete a content idea
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const contentIdea = await ContentIdea.findById(req.params.id);

    if (!contentIdea) {
      return res.status(404).json({ msg: 'Content idea not found' });
    }

    // Make sure user owns the content idea
    if (contentIdea.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await contentIdea.remove();
    res.json({ msg: 'Content idea removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 