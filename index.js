const { DataTypes, Model, Sequelize } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:', { logging: false });

class User extends Model {};

User.init({
  firstName: {
    type: DataTypes.STRING,
  },
  lastName: {
    type: DataTypes.STRING,
  },
  fullName: {
    type: new DataTypes.VIRTUAL(DataTypes.STRING, ['firstName', 'lastName']),
    get () {
      const firstName = this.getDataValue('firstName');
      const lastName = this.getDataValue('lastName');
      return `${firstName} ${lastName}`;
    },
    set (value) {
      if (typeof value === 'string' && value.indexOf(' ') > 0) {
        const names = value.split(' ');
        const [firstName, ...rest] = names;
        const lastName = rest.join(' ');
        this.setDataValue('firstName', firstName);
        this.setDataValue('lastName', lastName);
      }
    }
  },
  note: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  setNote: {
    type: new DataTypes.VIRTUAL(DataTypes.STRING, ['note']),
    set (value) {
      const prefix = `${this.getDataValue('firstName')}: `;
      this.setDataValue('note', `${prefix}${value}`);
    }
  },
}, {
  sequelize,
  modelName: 'User',
});


const testRun = async () => {
  await sequelize.sync({ force: true });

  // Works fine
  let user = await User.create({
    firstName: 'Foo',
    lastName: 'Bar',
  });
  console.log(user.fullName);   // It's "Foo Bar"

  // Works fine
  user.fullName = 'New Name';
  user = await user.save();
  console.log(user.fullName);   // It's "New Name"

  // Works fine
  await User.update({
    fullName: 'Another Name'
  }, {
    where: { id: user.id }
  });
  user = await User.findOne();
  console.log(user.fullName);   // It's "Another Name"

  // Doesn't work
  await User.update({
    setNote: 'My note'
  }, {
    where: { id: user.id }
  });
  user = await User.findOne();
  console.log(user.note);       // It's "undefined: My note"
  console.log(user.firstName);  // It's "Another"

  // Works fine
  await User.update({
    firstName: user.firstName,
    setNote: 'My note',
  }, {
    where: { id: user.id }
  });
  user = await User.findOne();
  console.log(user.note);       // It's "Another: My note"

  // Doesn't work
  await User.update({
    setNote: 'My note 2',
    firstName: user.firstName,
  }, {
    where: { id: user.id }
  });
  user = await User.findOne();
  console.log(user.note);       // It's "undefined: My note 2"
  console.log(user.firstName);  // It's "Another"

  // Works fine
  user.setNote = 'My other note';
  user = await user.save();
  console.log(user.note);       // It's "Another: My other note"

  // Works fine
  user.firstName = 'Firstname';
  user.setNote = 'Yet other note';
  user = await user.save();
  console.log(user.note);       // It's "Firstname: Yet other note"

  // Doesn't work
  user.setNote = 'Note!';
  user.firstName = 'FN';
  user = await user.save();
  console.log(user.note);       // It's "Firstname: Note!"
  console.log(user.firstName);  // It's "FN"
};

testRun();
