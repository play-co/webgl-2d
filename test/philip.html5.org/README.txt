Requires:
- Python 2.5
- PyCairo
- PySyck (or PyYAML)
- html5lib

Run specextract.py once, which extracts the relevant bits of the spec from the
file 'current-work' and produces 'current-work-canvas.xhtml'. Then run
gentest.py, which creates the contents of the 'tests' directory. Look in
'tests/index.html' for links to all the files. (Also a 'mochitests' directory
is created, for Mozilla's test framework.)

Most of the tests are defined in tests.yaml - they have references to spec
statements defined in spec.yaml, and JavaScript code which gets executed in the
test (plus some @-prefixed stuff to allow lazier test writing), and Python code
which uses PyCairo to generate the images of expected output.

(None of this has been designed (or cleaned up afterwards) for readability or
elegance; but it works for me.)
