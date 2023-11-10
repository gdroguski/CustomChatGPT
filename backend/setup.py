from setuptools import find_packages, setup

with open("dependencies.txt") as f:
    requirements = f.read().splitlines()

setup(
    name="backend",
    version="0.0.1",
    packages=find_packages(),
    install_requires=requirements,
)
