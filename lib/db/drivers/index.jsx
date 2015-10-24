import sqlite3 from './sqlite3';
import pg from './pg';


const drivers = {
  pg,
  sqlite3,
};

export default drivers;
