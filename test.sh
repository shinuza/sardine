node test-scripts create &&
mocha --recursive --compilers jsx:babel/register
CODE=$?
node test-scripts drop
exit $CODE;
