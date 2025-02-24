'use strict';

// Require the necessary things from Sequelize
const { Sequelize, Op, Model, DataTypes } = require('sequelize');

// This function should be used instead of `new Sequelize()`.
// It applies the config for your SSCCE to work on CI.
const createSequelizeInstance = require('./utils/create-sequelize-instance');

// This is an utility logger that should be preferred over `console.log()`.
const log = require('./utils/log');

// You can use sinon and chai assertions directly in your SSCCE if you want.
const sinon = require('sinon');
const { expect } = require('chai');

// Your SSCCE goes inside this function.
module.exports = async function () {
  const sequelize = createSequelizeInstance({
    logQueryParameters: true,
    benchmark: true,
    define: {
      timestamps: false // For less clutter in the SSCCE
    }
  });


  const foo = sequelize.define('foo', { name: {type: DataTypes.TEXT, primaryKey:true}, name2: DataTypes.TEXT });
  const bar = sequelize.define('bar', { name: {type: DataTypes.TEXT, primaryKey:true}, name2: DataTypes.TEXT });
  const baz = sequelize.define('baz', { name: {type: DataTypes.TEXT, primaryKey:true} });

  foo.belongsTo(bar, { foreignKey: 'name' });
  foo.belongsTo(baz, { foreignKey: 'name' });
  baz.hasMany(foo, { foreignKey: 'name' })

  const spy = sinon.spy();
  sequelize.afterBulkSync(() => spy());
  await sequelize.sync();
  expect(spy).to.have.been.called;

  foo.addScope('defaultScope', {
    include: [
      {
        model: bar,
        on: {
          'name2': { [Op.col]: 'foo.name2' }
        }
      }
    ]
  });

  await baz.create({ name: '1' });
  await bar.create({ name: '1', name2: '1' });
  await foo.create({ name: '1', name2: '1' });

  const f1 = await foo.findOne({
    where: {
      name: '1',
      name2: '1'
    }
  })
  expect(f1.bar.toJSON()).to.eql({ name: '1', name2: '1' })


  const bz1 = await baz.findOne({
    where: {
      name: '1'
    },
    include: [{ model: foo }]
  })

  expect(bz1.foo.bar.toJSON()).to.eql({ name: '1', name2: '1' })
};
