node test-scripts create &&
mocha --recursive --compilers jsx:babel/register
node test-scripts drop
