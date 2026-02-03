import { Injectable } from '@nestjs/common';

@Injectable()
export class GithubService {
  findAll() {
    return `This action returns all github`;
  }

  findOne(id: number) {
    return `This action returns a #${id} github`;
  }

  remove(id: number) {
    return `This action removes a #${id} github`;
  }
}
