#!/bin/bash
if [ -f ../rpn-calc.zip ]; then
    rm ../rpn-calc.zip
fi
zip ../rpn-calc.zip manifest.webapp icon*
tail -n+2 cache.manifest | grep -v ^\# | zip -@ ../rpn-calc.zip
