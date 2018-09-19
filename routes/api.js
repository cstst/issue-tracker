/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;

const ObjectId = require('mongodb').ObjectID;

module.exports = (app, db) => {

  app.route('/api/issues/:project')
  
    .get(async (req, res) => {
      const project = req.params.project;
      const doc = await db.collection('projects').findOne({name: project});
      res.json(doc.issues);
    })
    
    .post(async (req, res) => {
      const project = req.params.project;
      const {
        issue_title, 
        issue_text, 
        created_by, 
        assigned_to = '', 
        status_text = '' 
      } = req.body;
      const issue = {
        issue_title, 
        issue_text, 
        created_by, 
        assigned_to, 
        status_text,
        created_on: new Date(),
        updated_on: new Date(),
        open: true,
        _id: ObjectId()
      };
      const doc = await db.collection('projects').findAndModify(
        {"name": project},
        [["name", 1]],
        { "$push": {"issues": issue} },
        { new: true, upsert: true }
      );    
      const issues = doc.value.issues;
      res.json(issues[issues.length - 1]);
    })

  
    .put(async (req, res) => {
      const project = req.params.project;
      const _id = req.body._id;
      const doc = await db.collection('projects').findOne({"name": project});
      const issue = doc.issues.find(issue => issue._id == _id);
      if (!issue) {
          res.send('no issue with id ' + req.body_id);
      } else {
        const {
          open,
          issue_title, 
          issue_text, 
          created_by, 
          assigned_to, 
          status_text 
        } = issue;
        const {
          open: new_open = '',
          issue_title: new_issue_title = '', 
          issue_text: new_issue_text = '', 
          created_by: new_created_by = '', 
          assigned_to: new_assigned_to = '', 
          status_text: new_status_text = '' 
        } = req.body;
        try {
          await db.collection('projects').findAndModify(
            {
              "name": project, 
              "issues": { "$elemMatch": {"_id": ObjectId(_id)} }
            },
            [["name", 1]],
            {"$set": {
              "issues.$.issue_title": new_issue_title === '' ? issue_title : new_issue_title,
              "issues.$.open": new_open === '' ? open : new_open,
              "issues.$.issue_text": new_issue_text === '' ? issue_text : new_issue_text,
              "issues.$.created_by": new_created_by === '' ? created_by : new_created_by,
              "issues.$.assigned_to": new_assigned_to === '' ? assigned_to : new_assigned_to,
              "issues.$.status_text": new_status_text === '' ? status_text : new_status_text,
              "issues.$.updated_on": new Date()
            }},
            {new: true, upsert: false}
          );
          const fields = [
            new_open,
            new_issue_title, 
            new_issue_text, 
            new_created_by, 
            new_assigned_to, 
            new_status_text 
          ];
          if (fields.every(field => field === '')) {
            res.send('no updated field sent');
          } else {
            res.send('successfully updated');
          }
        } catch(err) {
          console.log(err);
          res.send('could not update ' + _id);
        }
      }
    })
  
    .delete(async (req, res) => {
      const project = req.params.project;
      if (!req.body._id){
        res.send('_id error');
      } else {
        const _id = req.body._id;
        const doc = await db.collection('projects').findOne({"name": project});
        const issue = doc.issues.find(issue => issue._id == _id);
        if (!issue) {
          res.send('no issue with id ' + _id);
        } else {
          try {
            await db.collection('projects').findAndModify(
              {"name": project },
              [ ["name", 1] ],
              { "$pull": { "issues": { "_id": ObjectId(_id) } } }
            );
            res.send('deleted ' + _id)
          } catch(err) {
            console.log(err);
            res.send('could not delete ' + _id)
          }
        }
      }
    });
};
