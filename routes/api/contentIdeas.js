const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const impersonation = require('../../middleware/impersonation');
const { check, validationResult } = require('express-validator');

const Product = require('../../models/product');
const ContentIdea = require('../../models/contentIdea');

// Helper to get the effective user ID (impersonated or real)
function getEffectiveUserId(req) {
  return req.impersonatedUserId || req.user.id;
}

// @route    GET api/content-ideas
// @desc     Get all content ideas for a user
// @access   Private
router.get('/', auth, impersonation, async (req, res) => {
  try {
    const contentIdeas = await ContentIdea.find({ user: getEffectiveUserId(req) })
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
router.get('/product/:productId', auth, impersonation, async (req, res) => {
  try {
    const contentIdeas = await ContentIdea.find({ 
      user: getEffectiveUserId(req),
      product: req.params.productId 
    }).sort({ postDateNeeded: 1 });
    res.json(contentIdeas);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/content-ideas/date/:date
// @desc     Get content ideas for a specific date
// @access   Private
router.get('/date/:date', auth, impersonation, async (req, res) => {
  try {
    const dateString = req.params.date;
    
    // Parse the date string (format: YYYY-MM-DD)
    const date = new Date(dateString);
    
    // Set to beginning of day in UTC
    date.setUTCHours(0, 0, 0, 0);
    
    // Set to end of day in UTC
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);
    
    // Find content ideas for this date
    const contentIdeas = await ContentIdea.find({
      user: getEffectiveUserId(req),
      postDateNeeded: {
        $gte: date,
        $lte: endDate
      }
    }).populate('product', 'name variant');
    
    res.json(contentIdeas);
  } catch (err) {
    console.error('Error fetching content ideas by date:', err);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/content-ideas
// @desc     Create a new content idea
// @access   Private
router.post('/', [
  auth,
  impersonation,
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
      filmDate,
      status,
      videoConcept,
      hook,
      script,
      sound,
      props,
      refUrl,
      finishedURL
    } = req.body;

    // Check if product exists and belongs to user
    const productExists = await Product.findOne({ 
      _id: product,
      user: getEffectiveUserId(req)
    });

    if (!productExists) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    const newContentIdea = new ContentIdea({
      user: getEffectiveUserId(req),
      product,
      postDateNeeded,
      filmDate: filmDate || null,
      status: status || 'Not Started',
      videoConcept,
      hook,
      script: script || '',
      sound: sound || '',
      props: props || '',
      url: refUrl || '',
      finishedURL: finishedURL || ''
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
router.put('/:id', auth, impersonation, async (req, res) => {
  try {
    let contentIdea = await ContentIdea.findById(req.params.id);

    if (!contentIdea) {
      return res.status(404).json({ msg: 'Content idea not found' });
    }

    // Make sure user owns the content idea
    if (contentIdea.user.toString() !== getEffectiveUserId(req)) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const {
      postDateNeeded,
      filmDate,
      status,
      videoConcept,
      hook,
      script,
      sound,
      props,
      refUrl,
      finishedURL,
      syncToGoogle
    } = req.body;

    // Build update object
    const contentIdeaFields = {};
    if (postDateNeeded) contentIdeaFields.postDateNeeded = postDateNeeded;
    if (filmDate !== undefined) contentIdeaFields.filmDate = filmDate;
    if (status) contentIdeaFields.status = status;
    if (videoConcept) contentIdeaFields.videoConcept = videoConcept;
    if (hook) contentIdeaFields.hook = hook;
    if (script !== undefined) contentIdeaFields.script = script;
    if (sound !== undefined) contentIdeaFields.sound = sound;
    if (props !== undefined) contentIdeaFields.props = props;
    if (refUrl !== undefined) contentIdeaFields.url = refUrl;
    if (finishedURL !== undefined) contentIdeaFields.finishedURL = finishedURL;
    if (typeof syncToGoogle !== 'undefined') contentIdeaFields.syncToGoogle = syncToGoogle;

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
router.delete('/:id', auth, impersonation, async (req, res) => {
  try {
    const contentIdea = await ContentIdea.findById(req.params.id);

    if (!contentIdea) {
      return res.status(404).json({ msg: 'Content idea not found' });
    }

    // Make sure user owns the content idea
    if (contentIdea.user.toString() !== getEffectiveUserId(req)) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await contentIdea.deleteOne();
    res.json({ msg: 'Content idea removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 