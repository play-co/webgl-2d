# WebGL-2D

# Make sure $JSSHELL points to your js shell binary in .profile or .bashrc
# Most targets use commands that need a js shell path specified
JSSHELL ?= $(error Specify a valid path to a js shell binary in ~/.profile: export JSSHELL=C:\path\js.exe or /path/js)

# Version number used in naming release files.
VERSION ?= $(error Specify a version for your release (e.g., VERSION=0.5))

# Run JSLINT
check-lint:
	${JSSHELL} -m -j -p -e "load('./support/jslint.js'); load('./support/jslint-cmdline.js'); runJslint(read('webgl-2d.js'));"

clean:
	rm -fr ./release
