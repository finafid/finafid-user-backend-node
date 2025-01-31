const HomePageComponent = require('../../models/home/homecontain'); // Import the Mongoose model

const createComponent = async (req, res) => {
     try {
       const { name, type, position, style, details, products } = req.body;
   
       const newComponent = new HomePageComponent({
         name,
         type,
         position,
         style,
         details,
         products,
       });
   
       const savedComponent = await newComponent.save();
       return res.status(201).json(savedComponent);
     } catch (err) {
       res.status(400).json({ error: err.message });
     }
   };

   const getAllComponents = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;  
      const limit = parseInt(req.query.limit) || 20;  // Ensure limit is a number
  
      const components = await HomePageComponent.find()
        .sort({ position: 1 }) 
        .skip((page - 1) * limit)
        .limit(limit);  // Ensure limit is a valid number
  
      const total = await HomePageComponent.countDocuments();
  
      return res.status(200).json({
        data: components,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

   const getComponentById = async (req, res) => {
     try {
       const { id } = req.params;
   
       const component = await HomePageComponent.findById(id);
       if (!component) {
         return res.status(404).json({ error: 'Component not found' });
       }
   
       return res.status(200).json(component);
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
   };

   const updateComponent = async (req, res) => {
     try {
       const { id } = req.params;
   
       const updatedComponent = await HomePageComponent.findByIdAndUpdate(
         id,
         req.body,
         { new: true } // Return the updated document
       );
   
       if (!updatedComponent) {
         return res.status(404).json({ error: 'Component not found' });
       }
   
       return res.status(200).json(updatedComponent);
     } catch (err) {
       res.status(400).json({ error: err.message });
     }
   };
   const deleteComponent = async (req, res) => {
     try {
       const { id } = req.params;
   
       const deletedComponent = await HomePageComponent.findByIdAndDelete(id);
       if (!deletedComponent) {
         return res.status(404).json({ error: 'Component not found' });
       }
   
       return res.status(200).json({ message: 'Component deleted successfully' });
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
   };

   
   module.exports = {
     createComponent,
     getAllComponents,
     getComponentById,
     updateComponent,
     deleteComponent,
   };
   